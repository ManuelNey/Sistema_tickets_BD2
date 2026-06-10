namespace Ticketing.API.DTOs;

public class MenuMatchDto
{
    public int IdEncuentro { get; set; }
    public string StadiumName { get; set; } = string.Empty;
    public string LocalTeam { get; set; } = string.Empty;
    public string VisitorTeam { get; set; } = string.Empty;
    public TimeOnly Time { get; set; }
    public DateOnly Date { get; set; }
    public double MinPrice { get; set; }
    public double MaxPrice { get; set; }
    public int AvailableTickets { get; set;}

}