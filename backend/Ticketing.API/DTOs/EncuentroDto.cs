namespace Ticketing.API.DTOs;

public class EncuentroDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public int EquipoLocal { get; set; }
    public int EquipoVisitante { get; set; }
    public int Estadio { get; set; }
    public int Pais { get; set;}
    public string Estado { get; set; } = string.Empty;
}
