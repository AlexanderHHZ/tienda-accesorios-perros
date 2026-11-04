using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

using PedidosService.Data;
using PedidosService.Services;

using PedidoServiceImpl = PedidosService.Services.PedidosService;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("MySqlBDO2");

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<PedidosDbContext>(options =>
        options.UseInMemoryDatabase("PedidosTestDb"));
}
else
{
    builder.Services.AddDbContext<PedidosDbContext>(options =>
        options.UseMySql(
            connectionString,
            ServerVersion.AutoDetect(connectionString)
        ));
}

builder.Services.AddScoped<IPedidosService, PedidoServiceImpl>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseAuthorization();

app.MapControllers();

app.Run();

