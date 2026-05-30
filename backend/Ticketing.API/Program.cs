var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:8080");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<Ticketing.API.Data.IPostgresConnectionFactory, Ticketing.API.Data.PostgresConnectionFactory>();
builder.Services.AddSingleton<Ticketing.API.Repositories.ITicketRepository, Ticketing.API.Repositories.TicketRepository>();
builder.Services.AddSingleton<Ticketing.API.Repositories.IMenuMatchDtoRepository, Ticketing.API.Repositories.MenuMatchDtoRepository>();

var app = builder.Build();

app.MapControllers();

app.UseSwagger();
app.UseSwaggerUI();

app.Run();
