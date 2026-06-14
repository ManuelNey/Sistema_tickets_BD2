namespace Ticketing.API.Repositories;

public interface IDispositivoRepository
{
    Task<bool> CheckDeviceEnabled(string deviceId, string mail);
}