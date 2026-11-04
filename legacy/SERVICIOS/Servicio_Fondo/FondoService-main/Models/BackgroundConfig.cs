namespace FondoService.Models;

public class BackgroundConfig
{
    public int Id { get; init; }
    public string Page { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string PrimaryColor { get; init; } = string.Empty;
    public string? SecondaryColor { get; init; }
    public string? ImageUrl { get; init; }
    public bool IsActive { get; init; }
    public DateTime UpdatedAt { get; init; }
}
