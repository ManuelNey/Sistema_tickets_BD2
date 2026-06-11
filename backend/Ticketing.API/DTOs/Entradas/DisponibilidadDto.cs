namespace Ticketing.API.DTOs;

public class DisponibilidadDto
{
    public int IdHabilita { get; set; }
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public DateOnly FechaPartido { get; set; }
    public TimeOnly HoraPartido { get; set; }
    public string Estadio { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public int Disponibles { get; set; }
}
