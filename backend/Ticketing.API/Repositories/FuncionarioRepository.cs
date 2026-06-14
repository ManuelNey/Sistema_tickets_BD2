using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class FuncionarioRepository : IFuncionarioRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public FuncionarioRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyCollection<FuncionarioDto>> GetAllAsync()
    {
        var funcionarios = new List<FuncionarioDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            @"SELECT p.mail, p.nombre, p.apellido
            FROM funcionario f
            JOIN persona p ON f.persona_mail = p.mail
            ORDER BY p.nombre, p.apellido;",
            connection);

        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            funcionarios.Add(new FuncionarioDto
            {
                Mail = reader.GetString(reader.GetOrdinal("mail")),
                Nombre = reader.GetString(reader.GetOrdinal("nombre")),
                Apellido = reader.GetString(reader.GetOrdinal("apellido"))
            });
        }

        return funcionarios;
    }
}
