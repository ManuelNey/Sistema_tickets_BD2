namespace Ticketing.API.DTOs;

public class CrearEstadioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public int PaisSedeId { get; set; }
}
