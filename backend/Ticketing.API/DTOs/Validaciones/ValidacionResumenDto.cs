namespace Ticketing.API.DTOs;

// Resumen de validaciones de entradas, para mostrar en la tabla de resumen de validaciones.
// Son básicamente las estadisticas de validaciones de entradas, para mostrar arriba en la tabla de resumen de validaciones.
public class ValidacionResumenDto
{
    public int TotalMes { get; set; }
    public int Hoy { get; set; }
    public int FuncionariosActivosHoy { get; set; }
    public int DispositivosEnUsoHoy { get; set; }
}
