using System.ComponentModel.DataAnnotations;
using FondoService.DTOs;
using FondoService.Models;

namespace FondoService.Services;

public class StoreBackgroundService : IBackgroundService
{
    private readonly List<BackgroundConfig> backgrounds = [];
    private readonly object syncRoot = new();
    private int nextId = 1;

    public StoreBackgroundService()
    {
        Create(new CreateBackgroundRequest
        {
            Page = "home", Type = "gradient", PrimaryColor = "#0F172A", SecondaryColor = "#1E293B"
        });
        Create(new CreateBackgroundRequest
        {
            Page = "login", Type = "color", PrimaryColor = "#F8FAFC"
        });
        Create(new CreateBackgroundRequest
        {
            Page = "productos", Type = "color", PrimaryColor = "#F1F5F9"
        });
    }

    public IReadOnlyList<BackgroundConfig> GetAll()
    {
        lock (syncRoot)
        {
            return backgrounds.ToArray();
        }
    }

    public BackgroundConfig? GetById(int id)
    {
        lock (syncRoot)
        {
            return backgrounds.Find(background => background.Id == id);
        }
    }

    public BackgroundConfig? GetByPage(string page)
    {
        lock (syncRoot)
        {
            return backgrounds.Find(background => background.IsActive
                && string.Equals(background.Page, page.Trim(), StringComparison.OrdinalIgnoreCase));
        }
    }

    public BackgroundConfig Create(CreateBackgroundRequest request)
    {
        Validator.ValidateObject(request, new ValidationContext(request), validateAllProperties: true);

        lock (syncRoot)
        {
            EnsureUniqueActivePage(request);
            var background = BuildConfig(nextId++, request);
            backgrounds.Add(background);
            return background;
        }
    }

    public BackgroundConfig? Update(int id, UpdateBackgroundRequest request)
    {
        Validator.ValidateObject(request, new ValidationContext(request), validateAllProperties: true);

        lock (syncRoot)
        {
            var index = backgrounds.FindIndex(background => background.Id == id);
            if (index < 0)
            {
                return null;
            }

            EnsureUniqueActivePage(request, id);
            var background = BuildConfig(id, request);
            backgrounds[index] = background;
            return background;
        }
    }

    public bool Delete(int id)
    {
        lock (syncRoot)
        {
            return backgrounds.RemoveAll(background => background.Id == id) > 0;
        }
    }

    // El bloqueo mantiene la comprobación y la escritura como una sola operación.
    private void EnsureUniqueActivePage(CreateBackgroundRequest request, int? excludedId = null)
    {
        if (request.IsActive && backgrounds.Any(background => background.IsActive
            && background.Id != excludedId
            && string.Equals(background.Page, request.Page.Trim(), StringComparison.OrdinalIgnoreCase)))
        {
            throw new ArgumentException("Ya existe una configuración activa para esa página.");
        }
    }

    private static BackgroundConfig BuildConfig(int id, CreateBackgroundRequest request)
    {
        return new BackgroundConfig
        {
            Id = id,
            Page = request.Page.Trim().ToLowerInvariant(),
            Type = request.Type.Trim().ToLowerInvariant(),
            PrimaryColor = request.PrimaryColor?.Trim() ?? string.Empty,
            SecondaryColor = string.IsNullOrWhiteSpace(request.SecondaryColor) ? null : request.SecondaryColor.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            IsActive = request.IsActive,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
