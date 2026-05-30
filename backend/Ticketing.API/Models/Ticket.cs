using System.ComponentModel.DataAnnotations;

namespace Ticketing.API.Models;

public class Ticket
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "open";

    public DateTime CreatedAt { get; set; }
}