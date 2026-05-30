using Ticketing.API.Models;

namespace Ticketing.API.Repositories;

public interface ITicketRepository
{
    Task<IReadOnlyCollection<Ticket>> GetAllAsync();
    Task<Ticket?> GetByIdAsync(int id);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task<bool> UpdateAsync(int id, Ticket ticket);
    Task<bool> DeleteAsync(int id);
}