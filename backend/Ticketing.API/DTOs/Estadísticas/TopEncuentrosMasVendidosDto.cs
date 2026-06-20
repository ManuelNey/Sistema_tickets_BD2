namespace Ticketing.API.DTOs;

public class TopEncuentrosMasVendidosDto
{
    public int Id { get; set; }
    public int EntradasVendidas { get; set; }
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public string NombreEstadio { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
}