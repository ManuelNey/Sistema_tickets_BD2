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
        ValidateAudience = false
    };
});
builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SchemaFilter<DateOnlySchemaFilter>());

builder.Services.AddSingleton<Ticketing.API.Data.IPostgresConnectionFactory, Ticketing.API.Data.PostgresConnectionFactory>();
builder.Services.AddSingleton<ITicketRepository, Ticketing.API.Repositories.TicketRepository>();
builder.Services.AddSingleton<Ticketing.API.Repositories.IMenuMatchDtoRepository, Ticketing.API.Repositories.MenuMatchDtoRepository>();
builder.Services.AddSingleton<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddSingleton<IJwtService, JwtService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
