namespace Ticketing.API.Models;

public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = "open";
    public DateTime CreatedAt { get; set; }
}