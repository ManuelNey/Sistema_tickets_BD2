using Ticketing.API.Data;
using Ticketing.API.DTOs;
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
                p.fecha_nacimiento,
                p.tipo_documento,
                p.numero_documento,
                p.pais_documento,
                p.pais_casa,
                p.localidad,
                p.calle,
                p.numero_casa,
                p.codigo_postal,
                p.contrasena,

                CASE
                    WHEN a.persona_mail IS NOT NULL THEN 'admin'
                    WHEN f.persona_mail IS NOT NULL THEN 'funcionario'
                    WHEN u.persona_mail IS NOT NULL THEN 'usuario'
                    ELSE ''
                END AS rol,

                u.identidad_verificada,
                u.fecha_registro,
                a.fk_pais_sede,

                COALESCE(
                    (
                        SELECT array_agg(t.telefono)
                        FROM telefonos t
                        WHERE t.persona_mail = p.mail
                    ),
                    ARRAY[]::text[]
                ) AS telefonos

            FROM persona p
            LEFT JOIN usuario u
                ON p.mail = u.persona_mail
            LEFT JOIN administrador a
                ON p.mail = a.persona_mail
            LEFT JOIN funcionario f
                ON p.mail = f.persona_mail
            WHERE p.mail = @mail;";

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

    public async Task<bool> UpdateProfileAsync(
    string mail,
    ActualizarPerfilDto perfil
)
{
    await using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    using var updatePersonaCmd = connection.CreateCommand();

    updatePersonaCmd.CommandText = @"
        UPDATE persona
        SET
            nombre = @nombre,
            apellido = @apellido,
            fecha_nacimiento = @fechaNacimiento,
            tipo_documento = @tipoDocumento,
            numero_documento = @numeroDocumento,
            pais_documento = @paisDocumento,
            pais_casa = @paisCasa,
            localidad = @localidad,
            calle = @calle,
            numero_casa = @numeroCasa,
            codigo_postal = @codigoPostal
        WHERE mail = @mail;";

    updatePersonaCmd.Parameters.AddWithValue("@mail", mail);
    updatePersonaCmd.Parameters.AddWithValue("@nombre", perfil.Nombre);
    updatePersonaCmd.Parameters.AddWithValue("@apellido", perfil.Apellido);
    updatePersonaCmd.Parameters.AddWithValue(
        "@fechaNacimiento",
        (object?)perfil.FechaNacimiento ?? DBNull.Value
    );
    updatePersonaCmd.Parameters.AddWithValue("@tipoDocumento", perfil.TipoDocumento);
    updatePersonaCmd.Parameters.AddWithValue("@numeroDocumento", perfil.NumeroDocumento);
    updatePersonaCmd.Parameters.AddWithValue("@paisDocumento", perfil.PaisDocumento);
    updatePersonaCmd.Parameters.AddWithValue("@paisCasa", perfil.PaisCasa);
    updatePersonaCmd.Parameters.AddWithValue("@localidad", perfil.Localidad);
    updatePersonaCmd.Parameters.AddWithValue("@calle", perfil.Calle);
    updatePersonaCmd.Parameters.AddWithValue("@numeroCasa", perfil.NumeroCasa);
    updatePersonaCmd.Parameters.AddWithValue("@codigoPostal", perfil.CodigoPostal);

    var filasActualizadas = await updatePersonaCmd.ExecuteNonQueryAsync();

    if (filasActualizadas == 0)
    {
        return false;
    }

    using var deleteTelefonosCmd = connection.CreateCommand();

    deleteTelefonosCmd.CommandText = @"
        DELETE FROM telefonos
        WHERE persona_mail = @mail;";

    deleteTelefonosCmd.Parameters.AddWithValue("@mail", mail);

    await deleteTelefonosCmd.ExecuteNonQueryAsync();

    foreach (var telefono in perfil.Telefonos)
    {
        if (string.IsNullOrWhiteSpace(telefono))
        {
            continue;
        }

        using var insertTelefonoCmd = connection.CreateCommand();

        insertTelefonoCmd.CommandText = @"
            INSERT INTO telefonos (persona_mail, telefono)
            VALUES (@mail, @telefono);";

        insertTelefonoCmd.Parameters.AddWithValue("@mail", mail);
        insertTelefonoCmd.Parameters.AddWithValue("@telefono", telefono.Trim());

        await insertTelefonoCmd.ExecuteNonQueryAsync();
    }

    return true;
}

    // Mapea lo renderizado de la consulta SQL a un DTO, manejando posibles valores nulos
    private static UsuarioResponseDto MapDto(NpgsqlDataReader reader)
    {
        var ordRol = reader.GetOrdinal("rol");
        var ordIdV = reader.GetOrdinal("identidad_verificada");
        var ordFR = reader.GetOrdinal("fecha_registro");
        var ordPais = reader.GetOrdinal("fk_pais_sede");
        var ordTelefonos = reader.GetOrdinal("telefonos");
        var ordFechaNacimiento = reader.GetOrdinal("fecha_nacimiento");

        return new UsuarioResponseDto
        {
            Mail = reader.GetString(reader.GetOrdinal("mail")),
            Nombre = reader.GetString(reader.GetOrdinal("nombre")),
            Apellido = reader.GetString(reader.GetOrdinal("apellido")),

            Rol = reader.IsDBNull(ordRol)
                ? string.Empty
                : reader.GetString(ordRol),

            IdentidadVerificada = reader.IsDBNull(ordIdV)
                ? null
                : reader.GetBoolean(ordIdV),

            FechaRegistro = reader.IsDBNull(ordFR)
                ? null
                : reader.GetDateTime(ordFR),

            PaisSede = reader.IsDBNull(ordPais)
                ? null
                : reader.GetInt32(ordPais),

            TipoDocumento = reader.IsDBNull(reader.GetOrdinal("tipo_documento"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("tipo_documento")),

            NumeroDocumento = reader.IsDBNull(reader.GetOrdinal("numero_documento"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("numero_documento")),

            PaisDocumento = reader.IsDBNull(reader.GetOrdinal("pais_documento"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("pais_documento")),

            PaisCasa = reader.IsDBNull(reader.GetOrdinal("pais_casa"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("pais_casa")),

            Localidad = reader.IsDBNull(reader.GetOrdinal("localidad"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("localidad")),

            Calle = reader.IsDBNull(reader.GetOrdinal("calle"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("calle")),

            NumeroCasa = reader.IsDBNull(reader.GetOrdinal("numero_casa"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("numero_casa")),

            CodigoPostal = reader.IsDBNull(reader.GetOrdinal("codigo_postal"))
                ? string.Empty
                : reader.GetString(reader.GetOrdinal("codigo_postal")),

            Telefonos = reader.IsDBNull(ordTelefonos)
                ? new List<string>()
                : reader.GetFieldValue<string[]>(ordTelefonos).ToList(),

            FechaNacimiento = reader.IsDBNull(ordFechaNacimiento)
                ? null
                : reader.GetFieldValue<DateOnly>(ordFechaNacimiento)
        };
    }
}
