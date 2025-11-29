using Heteroboxd.Models.DTO;
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

        //GET endpoints -> public access

        [HttpGet]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetAllFilms()
        {
            //retrives all films from database
            try
            {
                var AllFilms = await _service.GetAllFilms();
                return Ok(AllFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("trending")]
        public IActionResult GetTrendingFilms()
        {
            //retrives today's trending films from database
            //maybe a direct tMDB API call instead? only called once a day
            throw new NotImplementedException();
        }

        [HttpGet("{FilmId}")]
        [AllowAnonymous] //anyone can view films
        public async Task<IActionResult> GetFilm(int FilmId)
        {
            _logger.LogInformation($"Get Film endpoint hit with TmdbId: {FilmId}");
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
        [AllowAnonymous] //anyone can view films
        public async Task<IActionResult> GetFilmBySlug(string Slug, [FromQuery] int? FilmId)
        {
            _logger.LogInformation($"Get Film by Slug endpoint hit with Slug: {Slug}");
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
        public async Task<IActionResult> GetFilmsByYear(int Year, int Page = 1, int PageSize = 20)
        {
            //retrives all specific year's films from database
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
        public async Task<IActionResult> GetFilmsByGenre(string Genre, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"Get by Genre enpoint hit with Genre: {Genre}");
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
        public async Task<IActionResult> GetFilmsByCelebrity(int CelebrityId, int Page = 1, int PageSize = 20)
        {
            //retrives all films for a specific celebrity from database
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
        [AllowAnonymous] //public, because anyone can view these on any member's profile page
        public async Task<IActionResult> GetUsersWatchedFilms(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"Get UWF hit | UserId: {UserId}, Page: {Page}, PageSize: {PageSize}");
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

        [HttpGet("search")]
        public async Task<IActionResult> SearchFilms([FromQuery] string Search)
        {
            _logger.LogInformation($"Search Films endpoint hit with Query: {Search}");
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

        //PUT endpoints -> free access

        [HttpPut("favorite-count/{FilmId}/{FavoriteChange}")]
        public async Task<IActionResult> UpdateFilmFavoriteCount(int FilmId, string FavoriteChange)
        {
            //increments/decriments film's favorite count in database
            try
            {
                await _service.UpdateFilmFavoriteCountEfCore7Async(FilmId, FavoriteChange);
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