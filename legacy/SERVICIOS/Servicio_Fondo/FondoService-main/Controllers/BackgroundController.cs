using System.ComponentModel.DataAnnotations;
using FondoService.DTOs;
using FondoService.Models;
using FondoService.Services;
using Microsoft.AspNetCore.Mvc;

namespace FondoService.Controllers;

[ApiController]
[Route("api/background")]
public class BackgroundController(IBackgroundService backgroundService) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<BackgroundConfig>> GetAll()
    {
        return Ok(backgroundService.GetAll());
    }

    [HttpGet("{page}")]
    [ProducesResponseType(typeof(BackgroundConfig), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<BackgroundConfig> GetByPage(string page)
    {
        var background = backgroundService.GetByPage(page);
        return background is null
            ? NotFound(new { message = "No existe una configuración activa para esa página." })
            : Ok(background);
    }

    [HttpGet("id/{id:int}")]
    [ProducesResponseType(typeof(BackgroundConfig), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<BackgroundConfig> GetById(int id)
    {
        var background = backgroundService.GetById(id);
        return background is null
            ? NotFound(new { message = "No existe una configuración con ese ID." })
            : Ok(background);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BackgroundConfig), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<BackgroundConfig> Create(CreateBackgroundRequest request)
    {
        try
        {
            var background = backgroundService.Create(request);
            return CreatedAtAction(nameof(GetById), new { id = background.Id }, background);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("id/{id:int}")]
    [ProducesResponseType(typeof(BackgroundConfig), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<BackgroundConfig> Update(int id, UpdateBackgroundRequest request)
    {
        try
        {
            var background = backgroundService.Update(id, request);
            return background is null
                ? NotFound(new { message = "No existe una configuración con ese ID." })
                : Ok(background);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpDelete("id/{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult Delete(int id)
    {
        return backgroundService.Delete(id)
            ? Ok(new { message = "Configuración eliminada correctamente." })
            : NotFound(new { message = "No existe una configuración con ese ID." });
    }
}
