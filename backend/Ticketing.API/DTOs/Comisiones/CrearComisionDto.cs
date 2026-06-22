namespace Ticketing.API.DTOs;

public class CrearComisionDto
{
    public decimal Porcentaje { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
}
