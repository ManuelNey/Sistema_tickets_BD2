namespace Ticketing.API.DTOs;

public class ComprarEntradaResponse
{
    public List<int> IdsEntradas { get; set; } = new();

    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;

    public DateOnly FechaPartido { get; set; }

    public TimeOnly HoraPartido { get; set; }
    public string Estadio { get; set; } = string.Empty;

    public string DireccionEstadio { get; set; } = string.Empty;

    public string CiudadEstadio { get; set; } = string.Empty;

    public string PaisEstadio { get; set; } = string.Empty;

    public string Sector { get; set; } = string.Empty;

    public decimal PrecioUnitario { get; set; }

    public decimal MontoTotal { get; set; }

    public int CantidadEntradasDisponibles { get; set; }

    public int CantidadEntradasCompradas { get; set; }

    public DateOnly FechaCompra { get; set; }
    
}
