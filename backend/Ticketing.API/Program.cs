using System.Text;
using Microsoft.IdentityModel.Tokens;
using Ticketing.API.Filters;
using Ticketing.API.Repositories;
using Ticketing.API.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:8080");

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key not configured in appsettings.");

builder.Services.AddAuthentication("Bearer").AddJwtBearer(opt =>
{
    opt.RequireHttpsMetadata = false;
    opt.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = false,
        ValidateAudience = false,
        RoleClaimType = "rol"
    };
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
                "http://192.168.1.23:8081"
            ).AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SchemaFilter<DateOnlySchemaFilter>());

builder.Services.AddSingleton<Ticketing.API.Data.IPostgresConnectionFactory, Ticketing.API.Data.PostgresConnectionFactory>();
builder.Services.AddSingleton<Ticketing.API.Repositories.IMenuMatchDtoRepository, Ticketing.API.Repositories.MenuMatchDtoRepository>();
builder.Services.AddSingleton<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IEstadioRepository, EstadioRepository>();
builder.Services.AddSingleton<IEntradaRepository, EntradaRepository>();
builder.Services.AddSingleton<IEncuentroRepository, EncuentroRepository>();
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<ISectorRepository, SectorRepository>();
builder.Services.AddSingleton<ICompraRepository, CompraRepository>();
builder.Services.AddSingleton<IComisionRepository, ComisionRepository>();
builder.Services.AddSingleton<IPaisRepository, PaisRepository>();
builder.Services.AddSingleton<IDispositivoRepository, DispositivoRepository>();
builder.Services.AddSingleton<IFuncionarioRepository, FuncionarioRepository>();
builder.Services.AddSingleton<ITransferenciaRepository, TransferenciaRepository>();
builder.Services.AddSingleton<IEstadisticasRepository, EstadisticasRepository>();
builder.Services.AddSingleton<ITrabajaEnRepository, TrabajaEnRepository>();
builder.Services.AddSingleton<IValidacionRepository, ValidacionRepository>();
//Esto hace que cuando arraque la API también arranca este servicio en segundo plano
builder.Services.AddSingleton<ActualizarEstadosComprasService>();
builder.Services.AddSingleton<ActualizarEstadosEncuentrosService>();
builder.Services.AddSingleton<ActualizarEstadosTransferenciasService>();
builder.Services.AddSingleton<ActualizarEstadosService>();
builder.Services.AddHostedService<ActualizarEstadosBackgroundService>();


var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("FrontendDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
