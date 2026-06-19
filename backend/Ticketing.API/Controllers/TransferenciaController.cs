using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ticketing.API.DTOs;
using Ticketing.API.Repositories;

namespace Ticketing.API.Controllers;


[ApiController]


[Route("api/[controller]")]
public class TransferenciaController : ControllerBase
{
    private readonly ITransferenciaRepository _transferenciaRepository;

    public TransferenciaController(ITransferenciaRepository transferenciaRepository)
    {
        _transferenciaRepository = transferenciaRepository;
    }
    [HttpGet]
    [Authorize (Roles = "usuario")]

    public async Task<ActionResult<IReadOnlyCollection<TransferenciasEnviadasDto>>> GetAllAsync()
    {
        var mailEmisorClaim = User.FindFirst("mail")?.Value;

        if (string.IsNullOrWhiteSpace(mailEmisorClaim))
        {
            return Unauthorized();
        }

        var transferencias = await _transferenciaRepository.GetAllAsync(mailEmisorClaim);
        return Ok(transferencias);
    }

}
