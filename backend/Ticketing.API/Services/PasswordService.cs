using Microsoft.AspNetCore.Identity;
namespace Ticketing.API.Services;

public class PasswordService : IPasswordService
{
    private readonly PasswordHasher<object> _passwordHasher = new();

    public string HashPassword(string password)
    {
        return _passwordHasher.HashPassword(null!,password);
    }

    public bool VerifyPassword(string hashedPassword,string password)
    {
        var result = _passwordHasher.VerifyHashedPassword(null!,hashedPassword,password);

        return result == PasswordVerificationResult.Success
        || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}