namespace Ticketing.API.DTOs;

public class ComisionDto
{
    public int Id { get; set; }
    public decimal Porcentaje { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
}
