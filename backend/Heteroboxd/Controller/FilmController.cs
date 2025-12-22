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

        [HttpGet("slug/{Slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmBySlug(string Slug, [FromQuery] int? FilmId)
        {
            _logger.LogInformation($"GET Film by Slug endpoint hit for: {Slug}");
            try
            {
                var Film = await _service.GetFilmBySlug(Slug.ToLower(), FilmId);
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

        [HttpGet("celebrity/{CelebrityId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmsByCelebrity(int CelebrityId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Films by Celebrity endpoint hit for: {CelebrityId}");
            try
            {
                var CelebritiesFilms = await _service.GetFilmsByCelebrity(CelebrityId, Page, PageSize);
                return Ok(CelebritiesFilms);
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

        [HttpPut("favorite-count/{FilmId}/{FavoriteChange}")]
        [Authorize]
        public async Task<IActionResult> UpdateFilmFavoriteCount(int FilmId, string FavoriteChange)
        {
            _logger.LogInformation($"PUT Update Film Favorite Count endpoint hit for FilmId: {FilmId} with Change: {FavoriteChange}");
            try
            {
                await _service.UpdateFilmFavoriteCountEfCore7(FilmId, FavoriteChange);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
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