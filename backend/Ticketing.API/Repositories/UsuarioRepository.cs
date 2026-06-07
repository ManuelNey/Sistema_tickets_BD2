using Ticketing.API.Data;
using Ticketing.API.Dtos;
using Npgsql;

namespace Ticketing.API.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public UsuarioRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<UsuarioResponseDto?> GetByMailAsync(string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var cmd = connection.CreateCommand();

        cmd.CommandText = @"
            SELECT
                p.mail,
                p.nombre,
                p.apellido,
                COALESCE(u.identidad_verificada, false) AS identidad_verificada,
                COALESCE(u.fecha_registro, p.fecha_nacimiento::timestamp with time zone, now()) AS fecha_registro,
                CASE
                    WHEN a.persona_mail IS NOT NULL THEN 'admin'
                    WHEN f.persona_mail IS NOT NULL THEN 'funcionario'
                    WHEN u.persona_mail IS NOT NULL THEN 'usuario'
                    ELSE 'persona'
                END AS rol
            FROM persona p
            LEFT JOIN usuario u ON p.mail = u.persona_mail
            LEFT JOIN administrador a ON p.mail = a.persona_mail
            LEFT JOIN funcionario f ON p.mail = f.persona_mail
            WHERE p.mail = @mail";

        cmd.Parameters.AddWithValue("@mail", mail);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new UsuarioResponseDto
            {
                Mail = reader.GetString(0),
                Nombre = reader.GetString(1),
                Apellido = reader.GetString(2),
                IdentidadVerificada = reader.GetBoolean(3),
                FechaRegistro = reader.GetDateTime(4),
                Rol = reader.GetString(5)
            };
        }

        return null;
    }

    public async Task<bool> ExistsAsync(string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var cmd = connection.CreateCommand();

        cmd.CommandText = "SELECT 1 FROM persona WHERE mail = @mail LIMIT 1";
        cmd.Parameters.AddWithValue("@mail", mail);

        using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync();
    }

    public async Task CreateAsync(RegistroDto registro)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        using var insertPersonaCmd = connection.CreateCommand();
        insertPersonaCmd.CommandText = @"
            INSERT INTO persona (mail, nombre, apellido, fecha_nacimiento, tipo_documento,
                                pais_documento, numero_documento, pais_casa, localidad,
                                calle, numero_casa, codigo_postal, contrasena)
            VALUES (@mail, @nombre, @apellido, @fechaNacimiento, @tipoDocumento,
                    @paisDocumento, @numeroDocumento, @paisCasa, @localidad,
                    @calle, @numeroCasa, @codigoPostal, @contrasena)";

        insertPersonaCmd.Parameters.AddWithValue("@mail", registro.Mail);
        insertPersonaCmd.Parameters.AddWithValue("@nombre", registro.Nombre);
        insertPersonaCmd.Parameters.AddWithValue("@apellido", registro.Apellido);
        insertPersonaCmd.Parameters.AddWithValue("@tipoDocumento", registro.TipoDocumento);
        insertPersonaCmd.Parameters.AddWithValue("@fechaNacimiento", (object?)registro.FechaNacimiento ?? DBNull.Value);
        insertPersonaCmd.Parameters.AddWithValue("@paisDocumento", registro.PaisDocumento);
        insertPersonaCmd.Parameters.AddWithValue("@numeroDocumento", registro.NumeroDocumento);
        insertPersonaCmd.Parameters.AddWithValue("@paisCasa", registro.PaisCasa);
        insertPersonaCmd.Parameters.AddWithValue("@localidad", registro.Localidad);
        insertPersonaCmd.Parameters.AddWithValue("@calle", registro.Calle);
        insertPersonaCmd.Parameters.AddWithValue("@numeroCasa", registro.NumeroCasa);
        insertPersonaCmd.Parameters.AddWithValue("@codigoPostal", registro.CodigoPostal);
        insertPersonaCmd.Parameters.AddWithValue("@contrasena", registro.Contrasena);

        await insertPersonaCmd.ExecuteNonQueryAsync();

        using var insertUsuarioCmd = connection.CreateCommand();
        insertUsuarioCmd.CommandText = @"
            INSERT INTO usuario (persona_mail, identidad_verificada, fecha_registro)
            VALUES (@mail, false, @fechaRegistro)";

        insertUsuarioCmd.Parameters.AddWithValue("@mail", registro.Mail);
        insertUsuarioCmd.Parameters.AddWithValue("@fechaRegistro", DateTime.UtcNow);

        await insertUsuarioCmd.ExecuteNonQueryAsync();
    }

    public async Task<UsuarioResponseDto?> AuthenticateAsync(string mail, string contrasena)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var cmd = connection.CreateCommand();

        cmd.CommandText = @"
            SELECT
                p.mail,
                p.nombre,
                p.apellido,
                p.contrasena,
                COALESCE(u.identidad_verificada, false) AS identidad_verificada,
                COALESCE(u.fecha_registro, p.fecha_nacimiento::timestamp with time zone, now()) AS fecha_registro,
                CASE
                    WHEN a.persona_mail IS NOT NULL THEN 'admin'
                    WHEN f.persona_mail IS NOT NULL THEN 'funcionario'
                    WHEN u.persona_mail IS NOT NULL THEN 'usuario'
                    ELSE 'persona'
                END AS rol
            FROM persona p
            LEFT JOIN usuario u ON p.mail = u.persona_mail
            LEFT JOIN administrador a ON p.mail = a.persona_mail
            LEFT JOIN funcionario f ON p.mail = f.persona_mail
            WHERE p.mail = @mail";

        cmd.Parameters.AddWithValue("@mail", mail);

        using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync() && contrasena == reader.GetString(3))
        {
            return new UsuarioResponseDto
            {
                Mail = reader.GetString(0),
                Nombre = reader.GetString(1),
                Apellido = reader.GetString(2),
                IdentidadVerificada = reader.GetBoolean(4),
                FechaRegistro = reader.GetDateTime(5),
                Rol = reader.GetString(6)
            };
        }

        return null;
    }
}
