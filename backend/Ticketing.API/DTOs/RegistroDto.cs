namespace Ticketing.API.Dtos;

public class RegistroDto
{
    public string Mail { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string PaisDocumento { get; set; } = string.Empty;
    public string PaisCasa { get; set; } = string.Empty;
    public string Localidad { get; set; } = string.Empty;
    public string Calle { get; set; } = string.Empty;
    public string NumeroCasa { get; set; } = string.Empty;
    public string CodigoPostal { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
    public DateOnly? FechaNacimiento { get; set; }
}
