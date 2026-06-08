using Ticketing.API.Data;
using Ticketing.API.Dtos;
using Npgsql;
using Ticketing.API.Services;

namespace Ticketing.API.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    //Para el hasheo
    private readonly IPasswordService _passwordService;

    private readonly IPostgresConnectionFactory _connectionFactory;

    public UsuarioRepository(IPostgresConnectionFactory connectionFactory, IPasswordService passwordService)
    {
        _connectionFactory = connectionFactory;
        _passwordService = passwordService;
    }

    public async Task<UsuarioResponseDto?> GetByMailAsync(string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var cmd = connection.CreateCommand();

        // se hace un left join con las tablas de roles para determinar el rol de la persona
        cmd.CommandText = @"
            SELECT
                p.mail,
                p.nombre,
                p.apellido,
                CASE
                    WHEN a.persona_mail IS NOT NULL THEN 'admin'
                    WHEN f.persona_mail IS NOT NULL THEN 'funcionario'
                    WHEN u.persona_mail IS NOT NULL THEN 'usuario'
                END AS rol,
                u.identidad_verificada,
                u.fecha_registro,
                a.fk_pais_sede
            FROM persona p
            LEFT JOIN usuario u       ON p.mail = u.persona_mail
            LEFT JOIN administrador a ON p.mail = a.persona_mail
            LEFT JOIN funcionario f   ON p.mail = f.persona_mail
            WHERE p.mail = @mail";

        cmd.Parameters.AddWithValue("@mail", mail);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        return MapDto(reader);
    }

    // Verifica si existe un usuario con el mail dado
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

    // Crea un nuevo usuario, insertando en persona y usuario dentro de una transacción.
    public async Task CreateAsync(RegistroDto registro)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        //Abrimos la transacción para asegurar que ambas inserciones (persona y usuario) 
        // se realicen correctamente o se deshagan en caso de error
        await using var tx = await connection.BeginTransactionAsync();

        var hashedPassword = _passwordService.HashPassword(registro.Contrasena);

        using var insertPersonaCmd = connection.CreateCommand();
        insertPersonaCmd.Transaction = tx;
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
        insertPersonaCmd.Parameters.AddWithValue("@contrasena", hashedPassword);

        await insertPersonaCmd.ExecuteNonQueryAsync();

        using var insertUsuarioCmd = connection.CreateCommand();
        insertUsuarioCmd.Transaction = tx;
        insertUsuarioCmd.CommandText = @"
            INSERT INTO usuario (persona_mail, identidad_verificada)
            VALUES (@mail, false)";

        insertUsuarioCmd.Parameters.AddWithValue("@mail", registro.Mail);

        await insertUsuarioCmd.ExecuteNonQueryAsync();
        await tx.CommitAsync();
    }

    // Autentica a un usuario verificando el mail y la contraseña, y devuelve su información si es correcto.
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
                CASE
                    WHEN a.persona_mail IS NOT NULL THEN 'admin'
                    WHEN f.persona_mail IS NOT NULL THEN 'funcionario'
                    WHEN u.persona_mail IS NOT NULL THEN 'usuario'
                END AS rol,
                u.identidad_verificada,
                u.fecha_registro,
                a.fk_pais_sede,
                p.contrasena
            FROM persona p
            LEFT JOIN usuario u       ON p.mail = u.persona_mail
            LEFT JOIN administrador a ON p.mail = a.persona_mail
            LEFT JOIN funcionario f   ON p.mail = f.persona_mail
            WHERE p.mail = @mail";

        cmd.Parameters.AddWithValue("@mail", mail);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;


        var hashedPassword = reader.GetString(reader.GetOrdinal("contrasena"));

        if (!_passwordService.VerifyPassword(hashedPassword,contrasena))
        {
            return null;
        }

        return MapDto(reader);
    }

    // Mapea lo renderizado de la consulta SQL a un DTO, manejando posibles valores nulos
    private static UsuarioResponseDto MapDto(NpgsqlDataReader reader)
    {
        var ordRol     = reader.GetOrdinal("rol");
        var ordIdV     = reader.GetOrdinal("identidad_verificada");
        var ordFR      = reader.GetOrdinal("fecha_registro");
        var ordPais    = reader.GetOrdinal("fk_pais_sede");

        return new UsuarioResponseDto
        {
            Mail                = reader.GetString(reader.GetOrdinal("mail")),
            Nombre              = reader.GetString(reader.GetOrdinal("nombre")),
            Apellido            = reader.GetString(reader.GetOrdinal("apellido")),
            Rol                 = reader.IsDBNull(ordRol)  ? string.Empty          : reader.GetString(ordRol),
            IdentidadVerificada = reader.IsDBNull(ordIdV)  ? null                  : reader.GetBoolean(ordIdV),
            FechaRegistro       = reader.IsDBNull(ordFR)   ? null                  : reader.GetDateTime(ordFR),
            PaisSede            = reader.IsDBNull(ordPais) ? null                  : reader.GetInt32(ordPais)
        };
    }
}
