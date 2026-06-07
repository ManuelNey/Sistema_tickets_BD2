namespace Ticketing.API.Dtos;

public class UsuarioResponseDto
{
    public string Mail { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string Rol { get; set; } = "usuario";
    public bool IdentidadVerificada { get; set; }
    public DateTime FechaRegistro { get; set; }
    public string Token { get; set; } = string.Empty;
}
