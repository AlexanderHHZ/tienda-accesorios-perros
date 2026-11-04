# Ejecutar después de dotnet build. Solo utiliza PowerShell y el SDK de .NET.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

$projectRoot = Split-Path -Parent $PSScriptRoot
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromSeconds(10)
$script:checks = 0
$script:apiUrl = ''
$script:apiProcess = $null

function Assert-True($Condition, [string]$Description) {
    if (-not $Condition) { throw "Falló: $Description" }
    $script:checks++
}

function Invoke-Api([string]$Method, [string]$Path, [int]$ExpectedStatus, $Body = $null, $Headers = @{}) {
    $request = [System.Net.Http.HttpRequestMessage]::new(
        [System.Net.Http.HttpMethod]::new($Method), "$script:apiUrl$Path")
    if ($null -ne $Body) {
        $json = if ($Body -is [string]) { $Body } else { ConvertTo-Json -InputObject $Body -Depth 10 -Compress }
        $request.Content = [System.Net.Http.StringContent]::new($json, [Text.Encoding]::UTF8, 'application/json')
    }
    foreach ($key in $Headers.Keys) { [void]$request.Headers.TryAddWithoutValidation($key, $Headers[$key]) }

    $response = $null
    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        $content = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        Assert-True ([int]$response.StatusCode -eq $ExpectedStatus) "$Method $Path esperaba $ExpectedStatus, recibió $([int]$response.StatusCode): $content"
        $data = if ($content) { ConvertFrom-Json -InputObject $content } else { $null }
        if ($ExpectedStatus -ge 400 -and $Path -like '/api/background*') {
            Assert-True (-not [string]::IsNullOrWhiteSpace($data.message)) "Mensaje JSON de error: $Method $Path"
        }
        return [pscustomobject]@{ Data = $data; Headers = $response.Headers.ToString() }
    }
    finally {
        if ($null -ne $response) { $response.Dispose() }
        $request.Dispose()
    }
}

function Start-TestApi([string]$Environment) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $port = $listener.LocalEndpoint.Port
    $listener.Stop()
    $script:apiUrl = "http://127.0.0.1:$port"

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = 'dotnet'
    $startInfo.Arguments = "run --no-build --no-launch-profile --urls $script:apiUrl"
    $startInfo.WorkingDirectory = $projectRoot
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.EnvironmentVariables['ASPNETCORE_ENVIRONMENT'] = $Environment
    $startInfo.EnvironmentVariables['DOTNET_ENVIRONMENT'] = $Environment
    $startInfo.EnvironmentVariables.Remove('ASPNETCORE_HTTPS_PORT')
    $script:apiProcess = [System.Diagnostics.Process]::Start($startInfo)
    $script:outputTask = $script:apiProcess.StandardOutput.ReadToEndAsync()
    $script:errorTask = $script:apiProcess.StandardError.ReadToEndAsync()

    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    do {
        if ($script:apiProcess.HasExited) {
            throw "La API terminó antes de iniciar: $($script:outputTask.Result) $($script:errorTask.Result)"
        }
        try {
            $response = $client.GetAsync("$script:apiUrl/api/background").GetAwaiter().GetResult()
            $ready = $response.IsSuccessStatusCode
            $response.Dispose()
            if ($ready) { return }
        }
        catch { }
        Start-Sleep -Milliseconds 100
    } while ([DateTime]::UtcNow -lt $deadline)
    throw 'La API no inició dentro de 30 segundos.'
}

function Stop-TestApi {
    if ($null -ne $script:apiProcess) {
        if (-not $script:apiProcess.HasExited) {
            # Solo termina el proceso temporal de esta prueba y sus descendientes.
            & taskkill.exe /PID $script:apiProcess.Id /T /F | Out-Null
            if ($LASTEXITCODE -ne 0) {
                throw "No se pudo cerrar la instancia temporal (PID $($script:apiProcess.Id))."
            }
            if (-not $script:apiProcess.WaitForExit(5000)) {
                throw 'La instancia temporal no terminó dentro de 5 segundos.'
            }
        }
        $script:apiProcess.Dispose()
        $script:apiProcess = $null
    }
}

try {
    Start-TestApi 'Development'
    $all = (Invoke-Api 'GET' '/api/background' 200).Data
    Assert-True ($all.Count -eq 3) 'Tres fondos iniciales'
    $homeBackground = (Invoke-Api 'GET' '/api/background/HoMe' 200).Data
    Assert-True ($homeBackground.id -eq 1 -and $homeBackground.type -eq 'gradient') 'Consulta de página sin distinguir mayúsculas'
    Assert-True ($homeBackground.primaryColor -eq '#0F172A' -and $homeBackground.secondaryColor -eq '#1E293B') 'Colores iniciales de home'
    Assert-True ($homeBackground.isActive -and $null -eq $homeBackground.imageUrl) 'Campos del modelo inicial'
    Assert-True ($homeBackground.updatedAt.Kind -eq [DateTimeKind]::Utc -or "$($homeBackground.updatedAt)" -match 'Z$') 'Fecha generada en UTC'
    Assert-True ((Invoke-Api 'GET' '/api/background/id/1' 200).Data.page -eq 'home') 'Consulta por ID'
    Assert-True ((Invoke-Api 'GET' '/api/background/login' 200).Data.primaryColor -eq '#F8FAFC') 'Color inicial de login'
    Assert-True ((Invoke-Api 'GET' '/api/background/productos' 200).Data.primaryColor -eq '#F1F5F9') 'Color inicial de productos'
    $null = Invoke-Api 'GET' '/api/background/inexistente' 404
    $null = Invoke-Api 'GET' '/api/background/id/99999' 404

    $invalidBodies = @(
        @{ type = 'color'; primaryColor = '#FFF' },
        @{ page = ' '; type = 'color'; primaryColor = '#FFF' },
        @{ page = $null; type = 'color'; primaryColor = '#FFF' },
        @{ page = 'prueba'; primaryColor = '#FFF' },
        @{ page = 'prueba'; type = ' ' },
        @{ page = 'prueba'; type = $null },
        @{ page = 'prueba'; type = 'video' },
        @{ page = 'prueba'; type = 'color' },
        @{ page = 'prueba'; type = 'color'; primaryColor = ' ' },
        @{ page = 'prueba'; type = 'gradient'; secondaryColor = '#FFF' },
        @{ page = 'prueba'; type = 'gradient'; primaryColor = '#FFF' },
        @{ page = 'prueba'; type = 'gradient'; primaryColor = '#FFF'; secondaryColor = ' ' },
        @{ page = 'prueba'; type = 'image' },
        @{ page = 'prueba'; type = 'image'; imageUrl = ' ' }
    )
    foreach ($body in $invalidBodies) {
        $null = Invoke-Api 'POST' '/api/background' 400 $body
        $null = Invoke-Api 'PUT' '/api/background/id/1' 400 $body
    }
    $null = Invoke-Api 'POST' '/api/background' 400 '{'
    $null = Invoke-Api 'POST' '/api/background' 400 'null'
    $null = Invoke-Api 'POST' '/api/background' 400 '{"page":"test","type":"color","primaryColor":"#FFF","isActive":"yes"}'
    $null = Invoke-Api 'POST' '/api/background' 400 @{ page = ' HOME '; type = 'color'; primaryColor = '#FFF' }
    Assert-True ((Invoke-Api 'GET' '/api/background' 200).Data.Count -eq 3) 'Solicitudes inválidas no modifican los datos'

    $colorResponse = Invoke-Api 'POST' '/api/background' 201 @{ page = ' Carrito '; type = 'COLOR'; primaryColor = '#FFFFFF' }
    $colorId = $colorResponse.Data.id
    Assert-True ($colorResponse.Data.page -eq 'carrito' -and $colorResponse.Data.type -eq 'color' -and $colorResponse.Data.isActive) 'Normalización y actividad predeterminada'
    Assert-True ($colorResponse.Headers -match "Location: .*/api/background/id/$colorId") 'Location del recurso creado'
    Assert-True ((Invoke-Api 'GET' "/api/background/id/$colorId" 200).Data.page -eq 'carrito') 'Persistencia entre peticiones por Singleton'
    $gradient = (Invoke-Api 'POST' '/api/background' 201 @{ page = 'checkout'; type = 'gradient'; primaryColor = '#0F172A'; secondaryColor = '#1E293B' }).Data
    $image = (Invoke-Api 'POST' '/api/background' 201 @{ page = 'ofertas'; type = 'image'; imageUrl = 'https://placehold.co/1600x900/png' }).Data
    Assert-True ($image.primaryColor -eq '' -and $null -eq $image.secondaryColor) 'Imagen sin colores opcionales'
    $inactive = (Invoke-Api 'POST' '/api/background' 201 @{ page = 'HOME'; type = 'color'; primaryColor = '#FFF'; isActive = $false }).Data
    Assert-True ((Invoke-Api 'GET' "/api/background/id/$($inactive.id)" 200).Data.isActive -eq $false) 'Consulta de configuración inactiva por ID'
    Assert-True ((Invoke-Api 'GET' '/api/background/home' 200).Data.id -eq 1) 'Consulta por página omite la inactiva'
    $null = Invoke-Api 'PUT' "/api/background/id/$($inactive.id)" 400 @{ page = 'HOME'; type = 'color'; primaryColor = '#FFF'; isActive = $true }
    $null = Invoke-Api 'PUT' "/api/background/id/$colorId" 400 @{ page = 'login'; type = 'color'; primaryColor = '#FFF' }
    Assert-True ((Invoke-Api 'GET' "/api/background/id/$colorId" 200).Data.page -eq 'carrito') 'Conflicto de actualización no modifica el fondo'
    $updated = (Invoke-Api 'PUT' "/api/background/id/$colorId" 200 @{ page = 'carrito'; type = 'color'; primaryColor = '#E2E8F0'; isActive = $false }).Data
    Assert-True ($updated.id -eq $colorId -and $updated.primaryColor -eq '#E2E8F0' -and -not $updated.isActive) 'Actualización conserva ID y cambia campos'
    $null = Invoke-Api 'GET' '/api/background/carrito' 404
    $null = Invoke-Api 'PUT' '/api/background/id/99999' 404 @{ page = 'nueva'; type = 'color'; primaryColor = '#FFF' }
    $null = Invoke-Api 'PUT' '/api/background/id/1' 200 @{ page = 'home'; type = 'gradient'; primaryColor = '#0F172A'; secondaryColor = '#1E293B'; isActive = $false }
    $null = Invoke-Api 'PUT' "/api/background/id/$($inactive.id)" 200 @{ page = 'home'; type = 'color'; primaryColor = '#FFF'; isActive = $true }
    Assert-True ((Invoke-Api 'GET' '/api/background/home' 200).Data.id -eq $inactive.id) 'Cambio de configuración activa'
    $null = Invoke-Api 'DELETE' "/api/background/id/$colorId" 200
    $null = Invoke-Api 'GET' "/api/background/id/$colorId" 404
    $null = Invoke-Api 'DELETE' "/api/background/id/$colorId" 404
    $null = Invoke-Api 'DELETE' '/api/background/id/99999' 404

    # Envía peticiones concurrentes sin esperar la respuesta de la anterior.
    $requests = @()
    $pending = @()
    try {
        1..10 | ForEach-Object {
            $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, "$script:apiUrl/api/background")
            $request.Content = [System.Net.Http.StringContent]::new('{"page":"simultanea","type":"color","primaryColor":"#FFF"}', [Text.Encoding]::UTF8, 'application/json')
            $requests += $request
            $pending += $client.SendAsync($request)
        }
        $statuses = foreach ($task in $pending) {
            $response = $task.GetAwaiter().GetResult()
            [int]$response.StatusCode
            $response.Dispose()
        }
        Assert-True (@($statuses | Where-Object { $_ -eq 201 }).Count -eq 1) 'Solo una creación concurrente tiene éxito'
        Assert-True (@($statuses | Where-Object { $_ -eq 400 }).Count -eq 9) 'Nueve creaciones concurrentes se rechazan'
        $all = (Invoke-Api 'GET' '/api/background' 200).Data
        Assert-True (@($all | Where-Object { $_.page -eq 'simultanea' -and $_.isActive }).Count -eq 1) 'Un único fondo activo después de concurrencia'
    }
    finally { foreach ($request in $requests) { $request.Dispose() } }

    foreach ($origin in @('http://localhost:5173', 'http://127.0.0.1:3000', 'https://[::1]:4200')) {
        $cors = Invoke-Api 'OPTIONS' '/api/background' 204 $null @{ Origin = $origin; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'content-type' }
        Assert-True ($cors.Headers.Contains("Access-Control-Allow-Origin: $origin")) "CORS admite $origin"
        Assert-True ($cors.Headers -match 'Access-Control-Allow-Methods: .*POST') 'CORS admite POST'
    }
    $cors = Invoke-Api 'GET' '/api/background/home' 200 $null @{ Origin = 'http://localhost:5173' }
    Assert-True ($cors.Headers.Contains('Access-Control-Allow-Origin: http://localhost:5173')) 'CORS en respuesta real'
    $cors = Invoke-Api 'OPTIONS' '/api/background' 204 $null @{ Origin = 'https://frontend.example.com'; 'Access-Control-Request-Method' = 'POST' }
    Assert-True ($cors.Headers -notmatch 'Access-Control-Allow-Origin') 'CORS rechaza origen externo'

    $openapi = (Invoke-Api 'GET' '/openapi/v1.json' 200).Data
    $operationCount = 0
    foreach ($path in $openapi.paths.PSObject.Properties) {
        foreach ($operation in $path.Value.PSObject.Properties) {
            if ($operation.Name -in @('get', 'post', 'put', 'delete')) { $operationCount++ }
        }
    }
    Assert-True ($operationCount -eq 6) 'OpenAPI contiene las seis operaciones'
    Assert-True ($null -ne $openapi.paths.'/api/background/id/{id}'.get.responses.'200') 'OpenAPI describe consulta por ID'
    Assert-True ($null -ne $openapi.paths.'/api/background'.post.responses.'201') 'OpenAPI describe creación'

    Stop-TestApi
    Start-TestApi 'Production'
    $cors = Invoke-Api 'GET' '/api/background/home' 200 $null @{ Origin = 'http://localhost:5173' }
    Assert-True ($cors.Headers -notmatch 'Access-Control-Allow-Origin') 'CORS local no está habilitado en producción'
    $null = Invoke-Api 'GET' '/openapi/v1.json' 404
    Write-Host "Correcto: $script:checks comprobaciones; arranque, CRUD, validaciones, concurrencia, CORS y OpenAPI verificados."
}
finally {
    Stop-TestApi
    $client.Dispose()
    $handler.Dispose()
}
