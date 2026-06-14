namespace Ticketing.API.DTOs;

public class EstadioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public int PaisSedeId { get; set; }
    public string PaisNombre { get; set; } = string.Empty;
}
