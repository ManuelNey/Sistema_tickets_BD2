namespace Ticketing.API.DTOs;

public class SectorDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Capacidad { get; set; }
    public int Estadio { get; set; }
}
