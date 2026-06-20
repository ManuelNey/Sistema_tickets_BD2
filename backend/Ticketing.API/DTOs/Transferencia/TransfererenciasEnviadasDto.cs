namespace Ticketing.API.DTOs;

public class TransferenciasEnviadasDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Receptor { get; set; } = string.Empty;
    public int IdEntrada { get; set; }
    public string NombreEstadio { get; set; } = string.Empty;
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public string NombreSector { get; set; } = string.Empty;
    public int CantidadEntradas { get; set; }
}
