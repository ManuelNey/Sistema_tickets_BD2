namespace Ticketing.API.DTOs;

public class SectorDisponibleDto
{
    public int IdHabilita { get; set; }
    public int SectorId { get; set; }
    public string Sector { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int Disponibles { get; set; }
}
