using Heteroboxd.API.Service;
using Heteroboxd.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Heteroboxd.API.Controller
{
    [ApiController]
    [Route("api/celebrities")]
    public class CelebrityController : ControllerBase
    {
        private readonly ICelebrityService _service;
        private readonly ILogger<CelebrityController> _logger;

        public CelebrityController(ICelebrityService service, ILogger<CelebrityController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCelebrity(int CelebrityId, string? UserId = null)
        {
            _logger.LogInformation($"GetCelebrity endpoint hit for {CelebrityId}");
            try
            {
                return Ok(new {
                    Celebrity = await _service.GetCelebrity(CelebrityId),
                    IsFollowing = UserId == null ? false : await _service.Stans(UserId, CelebrityId)
                });
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

        [HttpGet("credits")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCredits(int CelebrityId, string? UserId = null, int Page = 1, int PageSize = 20, string Filter = "Starred", string Sort = "RELEASE DATE", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetCredits endpoint hit for {CelebrityId}");
            try
            {
                return Ok(await _service.GetCreditsDelimited(CelebrityId, UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchCelebrities(string Search, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"SearchCelebrities endpoint hit with {Search}");
            try
            {
                return Ok(await _service.SearchCelebrities(Search, Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost("stan")]
        [Authorize]
        public async Task<IActionResult> StanUnstanCelebrity(int CelebrityId)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"StanUnstanCelebrity endpoint hit for {CelebrityId} by User {UserId}");
            try
            {
                await _service.StanUnstanCelebrity(UserId!, CelebrityId);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
