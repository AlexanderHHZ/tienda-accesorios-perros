using FondoService.DTOs;
using FondoService.Models;

namespace FondoService.Services;

public interface IBackgroundService
{
    IReadOnlyList<BackgroundConfig> GetAll();
    BackgroundConfig? GetById(int id);
    BackgroundConfig? GetByPage(string page);
    BackgroundConfig Create(CreateBackgroundRequest request);
    BackgroundConfig? Update(int id, UpdateBackgroundRequest request);
    bool Delete(int id);
}
