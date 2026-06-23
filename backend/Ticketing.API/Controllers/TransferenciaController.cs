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

    [HttpGet("recibidas")]
    [Authorize (Roles = "usuario")]

    public async Task<ActionResult<IReadOnlyCollection<TransferenciasRecibidasDto>>> GetAllRecibidas()
    {
        var mailReceptorClaim = User.FindFirst("mail")?.Value;

        if (string.IsNullOrWhiteSpace(mailReceptorClaim))
        {
            return Unauthorized();
        }

        var transferencias = await _transferenciaRepository.GetAllReceived(mailReceptorClaim);
        return Ok(transferencias);
    }

    [HttpPut("{id:int}/resolver")]
    [Authorize(Roles = "usuario")]
    public async Task<ActionResult<ResolverTransferenciaDto>> ResolverTransferencia(
        int id,
        [FromBody] ResolverTransferenciaDto transferencia)
    {
        var mailReceptorClaim = User.FindFirst("mail")?.Value;

        if (string.IsNullOrWhiteSpace(mailReceptorClaim))
        {
            return Unauthorized();
        }

        try
        {
            var transferenciaResuelta = await _transferenciaRepository.ResolverTransferencia(
                id,
                transferencia,
                mailReceptorClaim
            );

            if (transferenciaResuelta == null)
                return NotFound();

            return Ok(transferenciaResuelta);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

}
