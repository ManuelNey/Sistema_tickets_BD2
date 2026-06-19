namespace Ticketing.API.DTOs;

public class TransferenciasRecibidasDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Emisor { get; set; } = string.Empty;
    public int IdEntrada { get; set; }
    public string NombreEstadio { get; set; } = string.Empty;
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public string NombreSector { get; set; } = string.Empty;
    public int CantidadEntradas { get; set; }
}
