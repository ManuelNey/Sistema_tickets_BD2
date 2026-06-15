using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;


public class DispositivoRepository : IDispositivoRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public DispositivoRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<bool> CheckDeviceEnabled(string deviceId, string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = @"
            SELECT COUNT(*)
            FROM dispositivo d
            JOIN trabaja_con t 
              ON d.numero_dispositivo = t.numero_dispositivo
            WHERE d.numero_dispositivo = @deviceId
              AND t.funcionario_mail = @mail
              AND d.estado = 'habilitado';
        ";

        await using var cmd = new NpgsqlCommand(sql, connection);
        cmd.Parameters.AddWithValue("@deviceId", deviceId);
        cmd.Parameters.AddWithValue("@mail", mail);

        var result = (long)await cmd.ExecuteScalarAsync();

        return result > 0;
    }

    public async Task<IReadOnlyCollection<DispositivoDto>> GetDispositivos()
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        const string sql = @"
            SELECT 
                d.numero_dispositivo,
                d.descripcion,
                d.estado,
                t.funcionario_mail
            FROM dispositivo d
            LEFT JOIN trabaja_con t 
                ON d.numero_dispositivo = t.numero_dispositivo
            ORDER BY d.numero_dispositivo;";

        await using var cmd = new NpgsqlCommand(sql, connection);

        var dispositivosPorNumero = new Dictionary<string, DispositivoDto>();

        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var numero = reader.GetString(reader.GetOrdinal("numero_dispositivo"));

            if (!dispositivosPorNumero.ContainsKey(numero))
            {
                dispositivosPorNumero[numero] = new DispositivoDto
                {
                    NumeroDispositivo = numero,
                    Descripcion = reader.GetString(reader.GetOrdinal("descripcion")),
                    Estado = reader.GetString(reader.GetOrdinal("estado")),
                    Funcionarios = new List<string>()
                };
            }

            var funcionarioOrdinal = reader.GetOrdinal("funcionario_mail");

            if (!reader.IsDBNull(funcionarioOrdinal))
            {
                dispositivosPorNumero[numero].Funcionarios.Add(
                    reader.GetString(funcionarioOrdinal)
                );
            }
        }

        return dispositivosPorNumero.Values.ToList();
    }

    public async Task<DispositivoDto?> CreateAsync(CrearDispositivoDto dispositivo)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"INSERT INTO dispositivo(numero_dispositivo, descripcion, estado)
            VALUES (@numero, @descripcion, 'habilitado')
            RETURNING numero_dispositivo, descripcion, estado;", connection);

        command.Parameters.AddWithValue("@numero", dispositivo.NumeroDispositivo);
        command.Parameters.AddWithValue("@descripcion", dispositivo.Descripcion);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            throw new InvalidOperationException("No se pudo crear el dispositivo.");
        }

        return new DispositivoDto
        {
            NumeroDispositivo = reader.GetString(reader.GetOrdinal("numero_dispositivo")),
            Descripcion = reader.GetString(reader.GetOrdinal("descripcion")),
            Estado = reader.GetString(reader.GetOrdinal("estado")),
            Funcionarios = new List<string>()
        };
    }

    public async Task<DispositivoDto?> UpdateAsync(string numeroDispositivo, ActualizarDispositivoDto dispositivo)
    {
    await using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    await using var transaction = await connection.BeginTransactionAsync();

    try
    {
        await using var command = new NpgsqlCommand(
            @"UPDATE dispositivo
            SET estado = @nuevoEstado,
                descripcion = @nuevaDescripcion
            WHERE numero_dispositivo = @numeroDispositivo
            RETURNING numero_dispositivo, descripcion, estado;",
            connection,
            transaction);

        command.Parameters.AddWithValue("@nuevoEstado", dispositivo.Estado);
        command.Parameters.AddWithValue("@nuevaDescripcion", dispositivo.Descripcion);
        command.Parameters.AddWithValue("@numeroDispositivo", numeroDispositivo);

        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            await transaction.RollbackAsync();
            return null;
        }

        var dispositivoActualizado = new DispositivoDto
        {
            NumeroDispositivo = reader.GetString(reader.GetOrdinal("numero_dispositivo")),
            Descripcion = reader.GetString(reader.GetOrdinal("descripcion")),
            Estado = reader.GetString(reader.GetOrdinal("estado")),
            Funcionarios = new List<string>()
        };

        await reader.DisposeAsync();

        // Validamos que cada mail enviado exista como funcionario antes de reemplazar asignaciones.
        foreach (var funcionarioMail in dispositivo.Funcionarios)
        {
            await using var validarFuncionarioCommand = new NpgsqlCommand(
                @"SELECT COUNT(*)
                FROM funcionario
                WHERE persona_mail = @funcionarioMail;",
                connection,
                transaction);

            validarFuncionarioCommand.Parameters.AddWithValue("@funcionarioMail", funcionarioMail);

            var existeFuncionario = Convert.ToInt64(
                await validarFuncionarioCommand.ExecuteScalarAsync()
            );

            if (existeFuncionario == 0)
            {
                await transaction.RollbackAsync();
                return null;
            }
        }

        await using var deleteFuncionariosCommand = new NpgsqlCommand(
            @"DELETE FROM trabaja_con
            WHERE numero_dispositivo = @numeroDispositivo;",
            connection,
            transaction);

        deleteFuncionariosCommand.Parameters.AddWithValue("@numeroDispositivo", numeroDispositivo);

        await deleteFuncionariosCommand.ExecuteNonQueryAsync();

        foreach (var funcionarioMail in dispositivo.Funcionarios)
        {
            await using var insertFuncionarioCommand = new NpgsqlCommand(
                @"INSERT INTO trabaja_con(funcionario_mail, numero_dispositivo)
                VALUES (@funcionarioMail, @numeroDispositivo);",
                connection,
                transaction);

            insertFuncionarioCommand.Parameters.AddWithValue("@funcionarioMail", funcionarioMail);
            insertFuncionarioCommand.Parameters.AddWithValue("@numeroDispositivo", numeroDispositivo);

            await insertFuncionarioCommand.ExecuteNonQueryAsync();

            dispositivoActualizado.Funcionarios.Add(funcionarioMail);
        }

        await transaction.CommitAsync();

        return dispositivoActualizado;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}

    public async Task<bool> DeleteAsync(string numeroDispositivo)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var deleteFuncionariosCommand = new NpgsqlCommand(
                @"DELETE FROM trabaja_con
                WHERE numero_dispositivo = @numeroDispositivo;",
                connection,
                transaction);

            deleteFuncionariosCommand.Parameters.AddWithValue("@numeroDispositivo", numeroDispositivo);

            await deleteFuncionariosCommand.ExecuteNonQueryAsync();

            await using var deleteDispositivoCommand = new NpgsqlCommand(
                @"DELETE FROM dispositivo
                WHERE numero_dispositivo = @numeroDispositivo;",
                connection,
                transaction);

            deleteDispositivoCommand.Parameters.AddWithValue("@numeroDispositivo", numeroDispositivo);

            var affectedRows = await deleteDispositivoCommand.ExecuteNonQueryAsync();

            await transaction.CommitAsync();

            return affectedRows > 0;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

}
