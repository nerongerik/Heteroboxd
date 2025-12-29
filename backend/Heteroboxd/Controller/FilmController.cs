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
        public IActionResult GetTrendingFilms()
        {
            //retrives today's trending films from database
            //maybe a direct tMDB API call instead? only called once a day
            throw new NotImplementedException();
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
        public async Task<IActionResult> ExploreFilms(int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation("GET Explore films endpoint hit.");
            try
            {
                var FilmPage = await _service.ExploreFilms(Page, PageSize);
                return Ok(FilmPage);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("popular")]
        [AllowAnonymous]
        public async Task<IActionResult> PopularOnHeteroboxd(int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation("GET Popular on Heteroboxd films endpoint hit.");
            try
            {
                var FilmPage = await _service.PopularFilms(Page, PageSize);
                return Ok(FilmPage);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("year/{Year}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmsByYear(int Year, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Films by Year endpoint hit for: {Year}");
            try
            {
                var YearsFilms = await _service.GetFilmsByYear(Year, Page, PageSize);
                return Ok(YearsFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("genre/{Genre}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmsByGenre(string Genre, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET by Genre enpoint hit for: {Genre}");
            try
            {
                var Results = await _service.GetFilmsByGenre(Genre, Page, PageSize);
                return Ok(Results);
            }
            catch             
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUsersWatchedFilms(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET UWF hit with UserId: {UserId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                var Result = await _service.GetUsersWatchedFilms(UserId, Page, PageSize);
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