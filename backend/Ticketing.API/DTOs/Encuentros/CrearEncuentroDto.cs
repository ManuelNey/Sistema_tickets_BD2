namespace Ticketing.API.DTOs;

public class CrearEncuentroDto
{
    public int EquipoLocalId { get; set; }
    public int EquipoVisitanteId { get; set; }
    public DateTime Fecha { get; set; }
    public int EstadioId { get; set; }
    public List<CrearEncuentroSectorDto> Sectores { get; set; } = new();
}
