namespace Ticketing.API.DTOs;

public class CompraDetalleDto
{
    public int IdCompra { get; set; }
    public string Estado { get; set; } = "";       
    public decimal MontoTotal { get; set; }
    public string EquipoLocal { get; set; } = "";
    public string EquipoVisitante { get; set; } = "";
    public DateTime FechaEncuentro { get; set; }
    public string Estadio { get; set; } = "";
    public string Sector { get; set; } = "";
    public int Cantidad { get; set; }
}