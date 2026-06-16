namespace Ticketing.API.DTOs;

// Pedido para enviar/transferir entradas de un grupo (habilita) a otro usuario.
// El front no manda ids de entradas: manda el grupo + la cantidad, y el back elige cuáles.
public class TransferirEntradaRequest
{
    public int IdHabilita { get; set; }
    public int Cantidad { get; set; }
    public string ReceptorMail { get; set; } = string.Empty;
}
