namespace Ticketing.API.DTOs;

public class ActualizarEncuentroDto
{
    public string Estado { get; set; } = string.Empty;
    public List<CrearEncuentroSectorDto> Sectores { get; set; } = new();
    public DateTime Fecha { get; set; }
    public int EstadioId { get; set; }
}