using System.ComponentModel.DataAnnotations;

namespace FondoService.DTOs;

public class CreateBackgroundRequest : IValidatableObject
{
    [Required(ErrorMessage = "La página es obligatoria.")]
    public string Page { get; set; } = string.Empty;

    [Required(ErrorMessage = "El tipo es obligatorio.")]
    public string Type { get; set; } = string.Empty;

    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var type = Type?.Trim().ToLowerInvariant();

        if (type is not ("color" or "gradient" or "image"))
        {
            yield return new ValidationResult("El tipo debe ser color, gradient o image.", [nameof(Type)]);
        }

        if (type is "color" or "gradient" && string.IsNullOrWhiteSpace(PrimaryColor))
        {
            yield return new ValidationResult("PrimaryColor es obligatorio para color y gradient.", [nameof(PrimaryColor)]);
        }

        if (type == "gradient" && string.IsNullOrWhiteSpace(SecondaryColor))
        {
            yield return new ValidationResult("SecondaryColor es obligatorio para gradient.", [nameof(SecondaryColor)]);
        }

        if (type == "image" && string.IsNullOrWhiteSpace(ImageUrl))
        {
            yield return new ValidationResult("ImageUrl es obligatorio para image.", [nameof(ImageUrl)]);
        }
    }
}
