using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;
using Ticketing.API.Services;

namespace Ticketing.API.Repositories;

public class FuncionarioRepository : IFuncionarioRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly IPasswordService _passwordService;

    public FuncionarioRepository(IPostgresConnectionFactory connectionFactory, IPasswordService passwordService)
    {
        _connectionFactory = connectionFactory;
        _passwordService = passwordService;
    }

    public async Task<IReadOnlyCollection<FuncionarioDto>> GetAllAsync()
    {
        var funcionarios = new List<FuncionarioDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(@"
            SELECT p.mail, p.nombre, p.apellido,
                   f.numero_legajo,
                   p.tipo_documento, p.pais_documento, p.numero_documento,
                   p.pais_casa
            FROM funcionario f
            JOIN persona p ON f.persona_mail = p.mail
            ORDER BY p.nombre, p.apellido;",
            connection);

        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            funcionarios.Add(new FuncionarioDto
            {
                Mail            = reader.GetString(reader.GetOrdinal("mail")),
                Nombre          = reader.GetString(reader.GetOrdinal("nombre")),
                Apellido        = reader.GetString(reader.GetOrdinal("apellido")),
                NumeroLegajo    = reader.GetInt32(reader.GetOrdinal("numero_legajo")),
                TipoDocumento   = reader.IsDBNull(reader.GetOrdinal("tipo_documento"))   ? "" : reader.GetString(reader.GetOrdinal("tipo_documento")),
                PaisDocumento   = reader.IsDBNull(reader.GetOrdinal("pais_documento"))   ? "" : reader.GetString(reader.GetOrdinal("pais_documento")),
                NumeroDocumento = reader.IsDBNull(reader.GetOrdinal("numero_documento")) ? "" : reader.GetString(reader.GetOrdinal("numero_documento")),
                PaisCasa        = reader.IsDBNull(reader.GetOrdinal("pais_casa"))        ? "" : reader.GetString(reader.GetOrdinal("pais_casa")),
            });
        }

        return funcionarios;
    }

    // Crea una persona nueva y la registra como funcionario en una sola transacción.
    // Si el mail ya existe, retorna null. El numero_legajo es SERIAL — la BD lo asigna.
    public async Task<FuncionarioDto?> CreateAsync(CrearFuncionarioDto dto)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var cmdExiste = new NpgsqlCommand(
                "SELECT 1 FROM persona WHERE mail = @mail LIMIT 1;",
                connection, transaction);
            cmdExiste.Parameters.AddWithValue("@mail", dto.Mail);

            if (await cmdExiste.ExecuteScalarAsync() != null)
                return null;

            var hashedPassword = _passwordService.HashPassword(dto.Contrasena);

            await using var cmdPersona = new NpgsqlCommand(@"
                INSERT INTO persona (mail, nombre, apellido, contrasena,
                    tipo_documento, pais_documento, numero_documento,
                    pais_casa, localidad, calle, numero_casa, codigo_postal,
                    fecha_nacimiento)
                VALUES (@mail, @nombre, @apellido, @contrasena,
                    @tipoDoc, @paisDoc, @numDoc,
                    @paisCasa, @localidad, @calle, @numCasa, @codPostal,
                    @fechaNac);",
                connection, transaction);

            cmdPersona.Parameters.AddWithValue("@mail",      dto.Mail);
            cmdPersona.Parameters.AddWithValue("@nombre",    dto.Nombre);
            cmdPersona.Parameters.AddWithValue("@apellido",  dto.Apellido);
            cmdPersona.Parameters.AddWithValue("@contrasena", hashedPassword);
            cmdPersona.Parameters.AddWithValue("@tipoDoc",   dto.TipoDocumento);
            cmdPersona.Parameters.AddWithValue("@paisDoc",   dto.PaisDocumento);
            cmdPersona.Parameters.AddWithValue("@numDoc",    dto.NumeroDocumento);
            cmdPersona.Parameters.AddWithValue("@paisCasa",  dto.PaisCasa);
            cmdPersona.Parameters.AddWithValue("@localidad", dto.Localidad);
            cmdPersona.Parameters.AddWithValue("@calle",     dto.Calle);
            cmdPersona.Parameters.AddWithValue("@numCasa",   dto.NumeroCasa);
            cmdPersona.Parameters.AddWithValue("@codPostal", dto.CodigoPostal);
            cmdPersona.Parameters.AddWithValue("@fechaNac",  (object?)dto.FechaNacimiento ?? DBNull.Value);

            await cmdPersona.ExecuteNonQueryAsync();

            // numero_legajo es SERIAL — la BD lo asigna automáticamente.
            await using var cmdFuncionario = new NpgsqlCommand(@"
                INSERT INTO funcionario (persona_mail)
                VALUES (@mail)
                RETURNING numero_legajo;",
                connection, transaction);

            cmdFuncionario.Parameters.AddWithValue("@mail", dto.Mail);

            var legajo = Convert.ToInt32(await cmdFuncionario.ExecuteScalarAsync());

            await transaction.CommitAsync();

            return new FuncionarioDto
            {
                Mail            = dto.Mail,
                Nombre          = dto.Nombre,
                Apellido        = dto.Apellido,
                NumeroLegajo    = legajo,
                TipoDocumento   = dto.TipoDocumento,
                PaisDocumento   = dto.PaisDocumento,
                NumeroDocumento = dto.NumeroDocumento,
                PaisCasa        = dto.PaisCasa,
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // Elimina al funcionario de la tabla funcionario (y sus asignaciones por CASCADE).
    // La fila en persona se conserva por restricción de permisos de BD.
    // Retorna false si el mail no corresponde a ningún funcionario.
    public async Task<bool> DeleteAsync(string mail)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand(
            "DELETE FROM funcionario WHERE persona_mail = @mail;",
            connection);
        cmd.Parameters.AddWithValue("@mail", mail);

        var filas = await cmd.ExecuteNonQueryAsync();
        return filas > 0;
    }
}
