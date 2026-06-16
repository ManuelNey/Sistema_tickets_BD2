namespace Ticketing.API.DTOs;

// Una card de "Mis Entradas": agrupa las entradas que el usuario posee
// por partido + sector (habilita), con el contador de disponibles y transferidas.
public class MisEntradasGrupoDto
{
    public int IdHabilita { get; set; }
    public string EquipoLocal { get; set; } = string.Empty;
    public string EquipoVisitante { get; set; } = string.Empty;
    public DateOnly FechaEncuentro { get; set; }
    public TimeOnly HoraEncuentro { get; set; }
    public string Estadio { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public string Sector { get; set; } = string.Empty;

    // Cantidad de entradas en estado 'activa' (las que se pueden usar o enviar).
    public int Disponibles { get; set; }

    // Cantidad de entradas en estado 'transferida' (enviadas, pendientes de que el receptor acepte).
    public int Transferidas { get; set; }
}
