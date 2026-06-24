namespace Ticketing.API.DTOs;

// Lista de validaciones de entradas, para mostrar en la tabla de validaciones con cada una de las filas de ValidacionDto
public class ValidacionesListaDto
{
    public int Total { get; set; }
    public int NumeroPagina { get; set; }
    public int CantidadPorPagina { get; set; }
    public List<ValidacionDto> Items { get; set; } = new();
}
