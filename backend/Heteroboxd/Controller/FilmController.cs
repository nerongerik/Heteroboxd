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
        public async Task<IActionResult> GetTrendingFilms()
        {
            _logger.LogInformation("GET Trending endpoint hit.");
            try
            {
                var Trending = await _service.GetTrending();
                return Ok(Trending);
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
            _logger.LogInformation($"GET Film endpoint hit for: {FilmId}");
            try
            {
                var Film = await _service.GetFilm(FilmId);
                return Ok(Film);
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
        public async Task<IActionResult> GetFilms(int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "RELEASE DATE", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation("GET Films endpoint hit.");
            try
            {
                var Result = await _service.GetFilms(Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Result);
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
            _logger.LogInformation($"GET UWF hit with UserId: {UserId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                var Result = await _service.GetUsersWatchedFilms(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Result);
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
            _logger.LogInformation($"GET Film's Ratings endpoint hit for {FilmId}");
            try
            {
                var Ratings = await _service.GetFilmRatings(FilmId);
                return Ok(Ratings);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchFilms([FromQuery] string Search)
        {
            _logger.LogInformation($"GET Search Films endpoint hit with: {Search}");
            try
            {
                var SearchResults = await _service.SearchFilms(Search);
                return Ok(SearchResults);
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}