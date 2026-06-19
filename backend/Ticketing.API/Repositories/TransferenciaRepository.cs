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
    
}
