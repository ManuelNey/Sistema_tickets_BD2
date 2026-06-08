namespace Ticketing.API.DTOs;

public class ComprarEntradaResponse
{
    // Id real de la fila compra que agrupa las entradas. Es el identificador del pedido.
    public int IdCompra { get; set; }

    // Numero de orden mostrado al usuario, derivado del IdCompra (ej. TM-000042).
    public string CodigoOrden { get; set; } = string.Empty;

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
