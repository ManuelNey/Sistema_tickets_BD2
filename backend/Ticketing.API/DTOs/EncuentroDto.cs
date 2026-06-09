namespace Ticketing.API.DTOs;

public class EstadioDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public int EquipoLocal { get; set; }
    public int EquipoVisitante { get; set; }
    public int Estadio { get; set; }
}
