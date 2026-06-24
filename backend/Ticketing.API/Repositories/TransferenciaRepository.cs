using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public class TransferenciaRepository : ITransferenciaRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public TransferenciaRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyCollection<TransferenciasEnviadasDto>> GetAllAsync(string mailEmisor)
    {
        var transferencias = new List<TransferenciasEnviadasDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"Select id_transferencia, enc.fecha, t.estado,fk_usuario_mail_receptor as receptor,
                e.id_entrada,s.nombre as nombre_estadio,ql.nombre as equipo_local,
                qv.nombre as equipo_visitante, sec.nombre as nombre_sector, count(id_transferencia) as cantidad
            from transferencia t join entrada e on t.fk_entrada_id = e.id_entrada
            join compra c on e.fk_compra_id = c.id_compra
            join habilita h on e.fk_habilita_id = h.id
            join sector sec on h.fk_sector = sec.id_sector
            join estadio s on sec.fk_estadio = s.id_estadio
            join encuentro enc on h.fk_encuentro = enc.id_encuentro
            join equipo ql on enc.fk_equipo_local = ql.id_equipo
            join equipo qv on enc.fk_equipo_visitante=qv.id_equipo
            where fk_usuario_mail_emisor=@mailEmisor
            group by 
                t.id_transferencia, 
                enc.fecha, 
                e.id_entrada,
                s.nombre,
                ql.nombre,
                qv.nombre,
                sec.nombre,
                t.estado,
                fk_usuario_mail_receptor;", connection);

            command.Parameters.AddWithValue("@mailEmisor", mailEmisor);

        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            transferencias.Add(new TransferenciasEnviadasDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_transferencia")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
                Estado = reader.GetString(reader.GetOrdinal("estado")),
                Receptor = reader.GetString(reader.GetOrdinal("receptor")),
                IdEntrada = reader.GetInt32(reader.GetOrdinal("id_entrada")),
                NombreEstadio = reader.GetString(reader.GetOrdinal("nombre_estadio")),
                EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                NombreSector = reader.GetString(reader.GetOrdinal("nombre_sector")),
                CantidadEntradas = (int)reader.GetInt64(reader.GetOrdinal("cantidad"))
            });
        }

        return transferencias;
    }

    public async Task<IReadOnlyCollection<TransferenciasRecibidasDto>> GetAllReceived(string mailReceptor)
    {
        var transferencias = new List<TransferenciasRecibidasDto>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"Select id_transferencia, enc.fecha, t.estado,fk_usuario_mail_emisor as emisor,
                e.id_entrada,s.nombre as nombre_estadio,ql.nombre as equipo_local,
                qv.nombre as equipo_visitante, sec.nombre as nombre_sector, count(id_transferencia) as cantidad
            from transferencia t join entrada e on t.fk_entrada_id = e.id_entrada
            join compra c on e.fk_compra_id = c.id_compra
            join habilita h on e.fk_habilita_id = h.id
            join sector sec on h.fk_sector = sec.id_sector
            join estadio s on sec.fk_estadio = s.id_estadio
            join encuentro enc on h.fk_encuentro = enc.id_encuentro
            join equipo ql on enc.fk_equipo_local = ql.id_equipo
            join equipo qv on enc.fk_equipo_visitante=qv.id_equipo
            where fk_usuario_mail_receptor=@mailReceptor
            group by 
                t.id_transferencia, 
                enc.fecha, 
                e.id_entrada,
                s.nombre,
                ql.nombre,
                qv.nombre,
                sec.nombre,
                t.estado,
                fk_usuario_mail_emisor;", connection);

            command.Parameters.AddWithValue("@mailReceptor", mailReceptor);

        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            transferencias.Add(new TransferenciasRecibidasDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("id_transferencia")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("fecha")),
                Estado = reader.GetString(reader.GetOrdinal("estado")),
                Emisor = reader.GetString(reader.GetOrdinal("emisor")),
                IdEntrada = reader.GetInt32(reader.GetOrdinal("id_entrada")),
                NombreEstadio = reader.GetString(reader.GetOrdinal("nombre_estadio")),
                EquipoLocal = reader.GetString(reader.GetOrdinal("equipo_local")),
                EquipoVisitante = reader.GetString(reader.GetOrdinal("equipo_visitante")),
                NombreSector = reader.GetString(reader.GetOrdinal("nombre_sector")),
                CantidadEntradas = (int)reader.GetInt64(reader.GetOrdinal("cantidad"))
            });
        }

        return transferencias;
    }

    public async Task<ResolverTransferenciaDto?> ResolverTransferencia(
    int id,
    ResolverTransferenciaDto transferencia,
    string mailReceptor)
{
    if (transferencia.Estado != "aceptada" && transferencia.Estado != "rechazada")
    {
        return null;
    }

    await using var connection = _connectionFactory.CreateConnection();
    await connection.OpenAsync();

    // Verificamos que la transferencia existe, es del receptor y está pendiente,
    // y de paso obtenemos el estado del encuentro para bloquear partidos ya terminados.
    await using var cmdCheck = new NpgsqlCommand(@"
        SELECT en.estado
        FROM transferencia t
        JOIN entrada    e  ON t.fk_entrada_id   = e.id_entrada
        JOIN habilita   h  ON e.fk_habilita_id  = h.id
        JOIN encuentro  en ON h.fk_encuentro    = en.id_encuentro
        WHERE t.id_transferencia          = @idTransferencia
          AND t.fk_usuario_mail_receptor  = @mailReceptor
          AND t.estado                    = 'pendiente';", connection);
    cmdCheck.Parameters.AddWithValue("@idTransferencia", id);
    cmdCheck.Parameters.AddWithValue("@mailReceptor", mailReceptor);

    await using (var checkReader = await cmdCheck.ExecuteReaderAsync())
    {
        if (!await checkReader.ReadAsync()) return null;
        var estadoEncuentro = checkReader.GetString(0);
        if (estadoEncuentro is "finalizado" or "cancelado")
            throw new InvalidOperationException("El partido ya finalizó o fue cancelado");
    }

    await using var command = new NpgsqlCommand(
        @"UPDATE transferencia
        SET estado = @nuevoEstado
        WHERE id_transferencia = @idTransferencia
            AND fk_usuario_mail_receptor = @mailReceptor
            AND estado = 'pendiente'
        RETURNING id_transferencia, estado, fk_entrada_id;", connection);

    command.Parameters.AddWithValue("@nuevoEstado", transferencia.Estado);
    command.Parameters.AddWithValue("@idTransferencia", id);
    command.Parameters.AddWithValue("@mailReceptor", mailReceptor);

    await using var reader = await command.ExecuteReaderAsync();

    if (!await reader.ReadAsync())
    {
        return null;
    }

    return new ResolverTransferenciaDto
    {
        Id = reader.GetInt32(reader.GetOrdinal("id_transferencia")),
        Estado = reader.GetString(reader.GetOrdinal("estado")),
        EntradaId = reader.GetInt32(reader.GetOrdinal("fk_entrada_id"))
    };
}
    
}
