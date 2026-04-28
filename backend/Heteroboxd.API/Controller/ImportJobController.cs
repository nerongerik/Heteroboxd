using Heteroboxd.API.Service;
using Heteroboxd.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Heteroboxd.API.Controller
{
    [ApiController]
    [Route("api/imports")]
    public class ImportJobController : ControllerBase
    {
        private readonly IImportJobService _service;
        private readonly ILogger<ImportJobController> _logger;

        public ImportJobController(IImportJobService service, ILogger<ImportJobController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> GetImportJobStatus()
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"GetImportJobStatus endpoint hit for UserId: {UserId}");
            try
            {
                return Ok(await _service.GetImportJobStatus(UserId!));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost("sign")]
        [Authorize]
        public async Task<IActionResult> SignImportJob(string FileName)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"SignImportJob endpoint hit for UserId: {UserId}");
            try
            {
                var Response = await _service.SignImportJob(UserId!, FileName);
                return Ok(new { Url = Response.PresignedUrl, Response.Key });
            }
            catch (ArgumentException e)
            {
                return BadRequest(e.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost("enqueue")]
        [Authorize]
        public async Task<IActionResult> EnqueueImportJob(string Key)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"EnqueueImportJob endpoint hit for UserId: {UserId}");
            try
            {
                await _service.EnqueueImportJob(UserId!, Key);
                return Ok();
            }
            catch (ArgumentException e)
            {
                return BadRequest(e.Message);
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
