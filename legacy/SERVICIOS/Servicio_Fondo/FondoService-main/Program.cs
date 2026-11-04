using FondoService.Services;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var messages = context.ModelState.Values
            .SelectMany(value => value.Errors)
            .Select(error => string.IsNullOrEmpty(error.ErrorMessage)
                ? "La solicitud contiene datos inválidos."
                : error.ErrorMessage)
            .Distinct();

        return new BadRequestObjectResult(new { message = string.Join(" ", messages) });
    };
});
builder.Services.AddSingleton<IBackgroundService, StoreBackgroundService>();
builder.Services.AddOpenApi();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options => options.AddPolicy("LocalFrontend", policy =>
        policy.SetIsOriginAllowed(origin =>
            Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            && uri.IsLoopback)
        .AllowAnyHeader()
        .WithMethods("GET", "POST", "PUT", "DELETE")));
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("LocalFrontend");
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

app.MapControllers();
app.Run();
