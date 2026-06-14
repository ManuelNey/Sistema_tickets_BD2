using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IDispositivoRepository
{
    Task<bool> CheckDeviceEnabled(string deviceId, string mail);
    Task<IReadOnlyCollection<DispositivoDto>> GetDispositivos();
    Task<DispositivoDto?> CreateAsync(CrearDispositivoDto dispositivo);
    Task<DispositivoDto?> UpdateAsync(string numeroDispositivo, ActualizarDispositivoDto dispositivo);
}
