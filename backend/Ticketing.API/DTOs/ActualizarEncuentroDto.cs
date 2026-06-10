namespace Ticketing.API.DTOs;

public class ActualizarEncuentroDto
{
    public string Estado { get; set; } = string.Empty;
    public List<CrearEncuentroSectorDto> Sectores { get; set; } = new();
}