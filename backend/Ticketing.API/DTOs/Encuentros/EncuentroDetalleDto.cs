namespace Ticketing.API.DTOs;

public class EncuentroDetalleDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public string Estado { get; set; } = string.Empty;

    public int EquipoLocalId { get; set; }
    public string EquipoLocalNombre { get; set; } = string.Empty;

    public int EquipoVisitanteId { get; set; }
    public string EquipoVisitanteNombre { get; set; } = string.Empty;

    public int EstadioId { get; set; }
    public string EstadioNombre { get; set; } = string.Empty;
    public string CiudadEstadio { get; set; } = string.Empty;

    public int PaisId { get; set; }
    public string PaisNombre { get; set; } = string.Empty;
}
