namespace Ticketing.API.DTOs;

public class EncuentroMenuDto
{
    public int IdEncuentro { get; set; }
    public string Estadio { get; set; } = string.Empty;
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public TimeOnly Hora { get; set; }
    public DateOnly Fecha { get; set; }
    public double PrecioMinimo { get; set; }
    public double PrecioMaximo { get; set; }
    public int EntradasDisponibles { get; set; }

}