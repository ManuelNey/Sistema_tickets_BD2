namespace Ticketing.API.DTOs;
// Fila por fila de validaciones de entradas, para mostrar en la tabla de validaciones  
public class ValidacionDto
{
    public DateTime Fecha { get; set; }
    public TimeOnly Hora { get; set; }
    public string Token { get; set; } = string.Empty;
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public string EstadioNombre { get; set; } = string.Empty;
    public string SectorNombre { get; set; } = string.Empty;
    public string FuncionarioNombre { get; set; } = string.Empty;
    public string FuncionarioApellido { get; set; } = string.Empty;
    public int FuncionarioLegajo { get; set; }
    public string NumeroDispositivo { get; set; } = string.Empty;
    public string DispositivoDescripcion { get; set; } = string.Empty;
}
