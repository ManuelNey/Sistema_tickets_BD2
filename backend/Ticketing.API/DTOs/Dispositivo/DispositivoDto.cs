namespace Ticketing.API.DTOs;

public class DispositivoDto
{
    public string NumeroDispositivo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public List<string> Funcionarios { get; set; } = new();
}