using Heteroboxd.API.Service;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Heteroboxd.API.Controller
{
    [ApiController]
    [Authorize]
    [Route("api/push-tokens")]
    public class PushTokenController : ControllerBase
    {
        private readonly IPushTokenService _service;
        private readonly ILogger<PushTokenController> _logger;

        public PushTokenController(IPushTokenService service, ILogger<PushTokenController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpPut]
        public async Task<IActionResult> Register(PushTokenRequest Request)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(UserId)) return Unauthorized();

            _logger.LogInformation($"RegisterPushToken endpoint hit for UserId: {UserId}");
            try
            {
                await _service.Register(UserId, Request.Token);
                return Ok();
            }
            catch (ArgumentException)
            {
                return BadRequest();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(PushTokenRequest Request)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(UserId)) return Unauthorized();

            _logger.LogInformation($"DeletePushToken endpoint hit for UserId: {UserId}");
            try
            {
                return await _service.Delete(UserId, Request.Token) ? Ok() : NotFound();
            }
            catch (ArgumentException)
            {
                return BadRequest();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
