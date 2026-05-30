using Microsoft.AspNetCore.Mvc;
using Ticketing.API.Models;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketRepository _ticketRepository;

    public TicketsController(ITicketRepository ticketRepository)
    {
        _ticketRepository = ticketRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Ticket>>> GetAll()
    {
        var tickets = await _ticketRepository.GetAllAsync();
        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Ticket>> GetById(int id)
    {
        var ticket = await _ticketRepository.GetByIdAsync(id);
        return ticket is null ? NotFound() : Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<Ticket>> Create([FromBody] Ticket ticket)
    {
        var createdTicket = await _ticketRepository.CreateAsync(ticket);
        return CreatedAtAction(nameof(GetById), new { id = createdTicket.Id }, createdTicket);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Ticket ticket)
    {
        var updated = await _ticketRepository.UpdateAsync(id, ticket);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _ticketRepository.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}