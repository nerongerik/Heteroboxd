using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/films")]
    public class FilmController : ControllerBase
    {
        private readonly IFilmService _service;
        private readonly ILogger<FilmController> _logger;

        public FilmController(IFilmService service, ILogger<FilmController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrendingFilms(string? LastSync = null)
        {
            _logger.LogInformation("GetTrendingFilms endpoint hit.");
            try
            {
                var Response = await _service.GetTrending(LastSync);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("{FilmId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilm(int FilmId)
        {
            _logger.LogInformation($"GetFilm endpoint hit for: {FilmId}");
            try
            {
                var Response = await _service.GetFilm(FilmId);
                return Ok(Response);
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

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilms(string? UserId = null, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "RELEASE DATE", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation("GetFilms endpoint hit.");
            try
            {
                var Response = await _service.GetFilms(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUsersWatchedFilms(string UserId, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "DATE WATCHED", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetUsersWatchedFilms endpoint hit with UserId: {UserId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                var Response = await _service.GetUsersWatchedFilms(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Response);
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

        [HttpGet("ratings/{FilmId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmRatings(int FilmId)
        {
            _logger.LogInformation($"GetFilmRatings endpoint hit for {FilmId}");
            try
            {
                var Response = await _service.GetFilmRatings(FilmId);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchFilms(string Search, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"SearchFilms endpoint hit with: {Search}");
            try
            {
                var Response = await _service.SearchFilms(Search, Page, PageSize);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}