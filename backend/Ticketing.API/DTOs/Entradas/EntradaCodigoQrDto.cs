namespace Ticketing.API.DTOs;

public class EntradaCodigoQrDto
{
    public int IdEntrada { get; set; }

    public string EquipoLocal { get; set; } = string.Empty;

    public string EquipoVisitante { get; set; } = string.Empty;

    public DateTime FechaEncuentro { get; set; }

    public string Sector { get; set; } = string.Empty;

    public string Estado { get; set; } = string.Empty;

    public string Origen { get; set; } = string.Empty;
}