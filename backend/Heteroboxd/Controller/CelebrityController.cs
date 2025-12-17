using Heteroboxd.Models.DTO;
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
        public IActionResult GetCelebrity(int CelebrityId)
        {
            _logger.LogInformation($"GET Celebrity endpoint hit for {CelebrityId}");
            try
            {
                var Celebrity = _service.GetCelebrity(CelebrityId);
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

        [HttpGet("cast-and-crew/{FilmId}")]
        [AllowAnonymous]
        public IActionResult GetCelebritiesByFilm(int FilmId)
        {
            _logger.LogInformation($"GET Celebrities by Film endpoint hit for {FilmId}");
            try
            {
                var Celebrities = _service.GetCelebritiesByFilm(FilmId);
                return Ok(Celebrities);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public IActionResult SearchCelebrities([FromQuery] string Search)
        {
            _logger.LogInformation($"GET Search Celebrities endpoint hit with {Search}");
            try
            {
                var Celebrities = _service.SearchCelebrities(Search);
                return Ok(Celebrities);
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
