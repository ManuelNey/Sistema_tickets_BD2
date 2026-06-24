using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class ValidacionRepository : IValidacionRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public ValidacionRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }
public async Task<ValidacionResumenDto> GetResumenAsync(int paisSedeId)
{
    // Todas las estadisticas vistas aqui son según el pais sede.
    await using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    var resumen = new ValidacionResumenDto();

    // Contamos las validaciones del mes actual
    await using (var cmd = new NpgsqlCommand(@"
        SELECT COUNT(*)
        FROM validacion v
        JOIN entrada e ON v.entrada_id = e.id_entrada
        JOIN habilita h ON e.fk_habilita_id = h.id
        JOIN encuentro en ON h.fk_encuentro = en.id_encuentro
        JOIN estadio est ON en.fk_estadio = est.id_estadio
        WHERE est.fk_pais_sede = @paisSedeId
          AND date_trunc('month', v.fecha) = date_trunc('month', NOW());",
        connection))
    // date_trunc nos permite tomar una fecha y cortarla al nivel que deseemos en este caso al mes. 
    // Comparamos la fecha truncada de la validación con la fecha truncada del momento actual para obtener solo las validaciones del mes en curso.
    // De esta manera solo comparamos mes y año, ignorando el día y la hora.
    {
        cmd.Parameters.AddWithValue("@paisSedeId", paisSedeId);
        resumen.TotalMes = (int)(long)(await cmd.ExecuteScalarAsync())!;
    }

    // Contamos las validaciones del día actual
    await using (var cmd = new NpgsqlCommand(@"
        SELECT COUNT(*)
        FROM validacion v
        JOIN entrada e ON v.entrada_id = e.id_entrada
        JOIN habilita h ON e.fk_habilita_id = h.id
        JOIN encuentro en ON h.fk_encuentro = en.id_encuentro
        JOIN estadio est ON en.fk_estadio = est.id_estadio
        WHERE est.fk_pais_sede = @paisSedeId
          AND v.fecha::date = CURRENT_DATE;",
        connection))
    {
        cmd.Parameters.AddWithValue("@paisSedeId", paisSedeId);
        resumen.Hoy = (int)(long)(await cmd.ExecuteScalarAsync())!;
    }

    // Contamos los distintos funcionarios que validaron hoy.
    await using (var cmd = new NpgsqlCommand(@"
        SELECT COUNT(DISTINCT v.funcionario_mail)
        FROM validacion v
        JOIN entrada e ON v.entrada_id = e.id_entrada
        JOIN habilita h ON e.fk_habilita_id = h.id
        JOIN encuentro en ON h.fk_encuentro = en.id_encuentro
        JOIN estadio est ON en.fk_estadio = est.id_estadio
        WHERE est.fk_pais_sede = @paisSedeId
          AND v.fecha::date = CURRENT_DATE;",
        connection))
    {
        cmd.Parameters.AddWithValue("@paisSedeId", paisSedeId);
        resumen.FuncionariosActivosHoy = (int)(long)(await cmd.ExecuteScalarAsync())!;
    }

    // Contamos la cantidad de dispositivos distintos que se han utilizado para validar hoy
    await using (var cmd = new NpgsqlCommand(@"
        SELECT COUNT(DISTINCT v.numero_dispositivo)
        FROM validacion v
        JOIN entrada e ON v.entrada_id = e.id_entrada
        JOIN habilita h ON e.fk_habilita_id = h.id
        JOIN encuentro en ON h.fk_encuentro = en.id_encuentro
        JOIN estadio est ON en.fk_estadio = est.id_estadio
        WHERE est.fk_pais_sede = @paisSedeId
          AND v.fecha::date = CURRENT_DATE;",
        connection))
    {
        cmd.Parameters.AddWithValue("@paisSedeId", paisSedeId);
        resumen.DispositivosEnUsoHoy = (int)(long)(await cmd.ExecuteScalarAsync())!;
    }

    return resumen;
}

    public async Task<ValidacionesListaDto> GetValidacionesAsync(
        int paisSedeId,
        DateTime? desde,
        DateTime? hasta,
        int? estadioId,
        string? funcionarioMail,
        int numeroPagina,
        int cantidadPorPagina)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Construimos el filtro para el where de manera dinámica con los parametro que recibimos.
        var filtros = "";
        if (desde.HasValue)                    
        {          
            filtros += " AND v.fecha >= @desde";
        }
        if (hasta.HasValue)                              
        {          
            filtros += " AND v.fecha < @hasta + interval '1 day'";
        }
        if (estadioId.HasValue)                          
        {
            filtros += " AND est.id_estadio = @estadioId";
        }
        if (!string.IsNullOrWhiteSpace(funcionarioMail)) 
        {
            filtros += " AND v.funcionario_mail = @funcionarioMail";
        }

        // Por seguridad solo mostramos los primero 8 caracteres del token utilizado
        var consulta = $@"
            SELECT
                v.fecha,
                v.hora,
                LEFT(v.token_utilizado, 8)  AS token,
                el.nombre                   AS equipo_local,
                ev.nombre                   AS equipo_visitante,
                est.nombre                  AS estadio_nombre,
                s.nombre                    AS sector_nombre,
                p.nombre                    AS funcionario_nombre,
                p.apellido                  AS funcionario_apellido,
                f.numero_legajo             AS funcionario_legajo,
                v.numero_dispositivo,
                d.descripcion               AS dispositivo_descripcion,
                COUNT(*) OVER()             AS total
            FROM validacion v
            JOIN entrada    e   ON v.entrada_id          = e.id_entrada
            JOIN habilita   h   ON e.fk_habilita_id      = h.id
            JOIN encuentro  en  ON h.fk_encuentro        = en.id_encuentro
            JOIN equipo     el  ON en.fk_equipo_local    = el.id_equipo
            JOIN equipo     ev  ON en.fk_equipo_visitante= ev.id_equipo
            JOIN estadio    est ON en.fk_estadio         = est.id_estadio
            JOIN sector     s   ON h.fk_sector           = s.id_sector
            JOIN persona    p   ON v.funcionario_mail    = p.mail
            JOIN funcionario f  ON v.funcionario_mail    = f.persona_mail
            JOIN dispositivo d  ON v.numero_dispositivo  = d.numero_dispositivo
            WHERE est.fk_pais_sede = @paisSedeId
            {filtros}
            ORDER BY v.fecha DESC
            LIMIT @cantidadPorPagina OFFSET @desplazamiento;";
            // Aclaramos la cantidad de resultados que queremos con limit
            // y el desplazamiento para indicar desde qué resultado queremos empezar a mostrar.

        await using var cmd = new NpgsqlCommand(consulta, connection);

        cmd.Parameters.AddWithValue("@paisSedeId",       paisSedeId);
        cmd.Parameters.AddWithValue("@cantidadPorPagina", cantidadPorPagina);
        cmd.Parameters.AddWithValue("@desplazamiento",   (numeroPagina - 1) * cantidadPorPagina);

        if (desde.HasValue)
        {
            cmd.Parameters.AddWithValue("@desde",           desde.Value);
        } 
        if (hasta.HasValue)                              
        {
            cmd.Parameters.AddWithValue("@hasta",           hasta.Value);
        }
        if (estadioId.HasValue)                          
        {
            cmd.Parameters.AddWithValue("@estadioId",       estadioId.Value);
        }
        if (!string.IsNullOrWhiteSpace(funcionarioMail)) 
        {
            cmd.Parameters.AddWithValue("@funcionarioMail", funcionarioMail);
        }

        var elementos = new List<ValidacionDto>();
        var total = 0; // Guardamos el total de validaciones que cumplen con los filtros.

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (elementos.Count == 0)
                total = (int)reader.GetInt64(reader.GetOrdinal("total"));

            var descripcion = "";
            if (!reader.IsDBNull(reader.GetOrdinal("dispositivo_descripcion")))
            {
                descripcion = reader.GetString(reader.GetOrdinal("dispositivo_descripcion"));
            }

            elementos.Add(new ValidacionDto
            {
                Fecha                  = reader.GetDateTime(reader.GetOrdinal("fecha")),
                Hora                   = reader.GetFieldValue<TimeOnly>(reader.GetOrdinal("hora")),
                Token         = reader.GetString(reader.GetOrdinal("token")),
                EquipoLocal            = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante        = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                EstadioNombre          = reader.GetString(reader.GetOrdinal("estadio_nombre")),
                SectorNombre           = reader.GetString(reader.GetOrdinal("sector_nombre")),
                FuncionarioNombre      = reader.GetString(reader.GetOrdinal("funcionario_nombre")),
                FuncionarioApellido    = reader.GetString(reader.GetOrdinal("funcionario_apellido")),
                FuncionarioLegajo      = reader.GetInt32(reader.GetOrdinal("funcionario_legajo")),
                NumeroDispositivo      = reader.GetString(reader.GetOrdinal("numero_dispositivo")),
                DispositivoDescripcion = descripcion,
            });
        }

        return new ValidacionesListaDto
        {
            Total             = total,
            NumeroPagina      = numeroPagina,
            CantidadPorPagina = cantidadPorPagina,
            Items             = elementos,
        };
    }
}
