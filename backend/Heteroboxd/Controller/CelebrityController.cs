using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
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

        [HttpGet("{CelebrityId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCelebrity(int CelebrityId)
        {
            _logger.LogInformation($"GET Celebrity endpoint hit for {CelebrityId}");
            try
            {
                var Celebrity = await _service.GetCelebrity(CelebrityId);
                return Ok(Celebrity);
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

        [HttpGet("{CelebrityId}/credits")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCredits(int CelebrityId, int Page = 1, int PageSize = 20, string Filter = "Starred", string Sort = "RELEASE DATE", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GET Credits endpoint hit for {CelebrityId}");
            try
            {
                var Response = await _service.GetCreditsDelimited(CelebrityId, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchCelebrities([FromQuery] string Search)
        {
            _logger.LogInformation($"GET Search Celebrities endpoint hit with {Search}");
            try
            {
                var Celebrities = await _service.SearchCelebrities(Search);
                return Ok(Celebrities);
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
