using Microsoft.AspNetCore.Identity;
namespace Ticketing.API.Services;

public class PasswordService : IPasswordService
{
    // Instancia de PasswordHasher para manejar el hashing y verificación de contraseñas
    private readonly PasswordHasher<object> _passwordHasher = new();

    // Genera un hash de la contraseña dado
    public string HashPassword(string password)
    {
        return _passwordHasher.HashPassword(null!,password);
    }

    // Verifica si la contraseña proporcionada coincide con el hash almacenado
    public bool VerifyPassword(string hashedPassword,string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(null!,hashedPassword,password);

        // Retorna true si la verificación es exitosa o si se requiere un rehash (lo que indica que la contraseña es válida pero el hash necesita actualizarse)
        return result == PasswordVerificationResult.Success
        || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}