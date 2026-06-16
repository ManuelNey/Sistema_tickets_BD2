namespace Ticketing.API.DTOs;

public class CompraDetalleDto
{
    public int IdCompra { get; set; }
    public string Estado { get; set; } = "";
    public decimal MontoTotal { get; set; }
    public decimal PrecioUnitario { get; set; }   // precio base de la entrada (sin comisión)
    public string EquipoLocal { get; set; } = "";
    public string EquipoVisitante { get; set; } = "";
    public DateOnly FechaEncuentro { get; set; }
    public TimeOnly HoraEncuentro {get; set; }
    public string Estadio { get; set; } = "";
    public string Sector { get; set; } = "";
    public int Cantidad { get; set; }
    public DateTime FechaReserva { get; set; }   // compra.fecha, la usa el front para el countdown de los 30 min. 
    // Después vamos a hacer que la bd la cancele automáticamente, pero por ahora el front la cancela cuando se cumple el tiempo.
}