namespace Ticketing.API.DTOs;

public class ActualizarDispositivoDto
{
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public List<string> Funcionarios { get; set; } = new();
}