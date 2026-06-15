using Ticketing.API.DTOs;

namespace Ticketing.API.Repositories;

public interface IComisionRepository
{
    // Devuelve la comisión vigente hoy, o null si no hay ninguna vigente.
    Task<ComisionVigenteDto?> GetVigenteAsync();
}
