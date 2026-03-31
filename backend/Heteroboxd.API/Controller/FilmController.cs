using Heteroboxd.API.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.API.Controller
{
    [ApiController]
    [Route("api/films")]
    public class FilmController : ControllerBase
    {
        private readonly IFilmService _service;
        private readonly IUserListService _userListService;
        private readonly IReviewService _reviewService;
        private readonly ILogger<FilmController> _logger;

        public FilmController(IFilmService service, IUserListService userListService, IReviewService reviewService, ILogger<FilmController> logger)
        {
            _service = service;
            _userListService = userListService;
            _reviewService = reviewService;
            _logger = logger;
        }

        [HttpGet("trending")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrendingFilms(string? LastSync = null)
        {
            _logger.LogInformation("GetTrendingFilms endpoint hit.");
            try
            {
                return Ok(await _service.GetTrending(LastSync));
            }
            catch (ArgumentException)
            {
                return BadRequest()
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilm(int FilmId)
        {
            _logger.LogInformation($"GetFilm endpoint hit for: {FilmId}");
            try
            {
                return Ok(
                new {
                    Film = await _service.GetFilm(FilmId), 
                    Ratings = await _service.GetFilmRatings(FilmId) 
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

        [HttpGet("subsequent")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmSubsequent(int FilmId, int PageSize = 5)
        {
            _logger.LogInformation($"GetFilmSubsequent endpoint hit for: {FilmId}");
            try
            {
                return Ok(
                new 
                {
                    Reviews = await _reviewService.GetTopX(FilmId, PageSize), 
                    Lists = await _userListService.GetListsFeaturingFilmCount(FilmId) 
                });
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilms(string? UserId = null, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "RELEASE DATE", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation("GetFilms endpoint hit.");
            try
            {
                return Ok(await _service.GetFilms(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("shuffle")]
        [AllowAnonymous]
        public async Task<IActionResult> ShuffleFilms(string? UserId = null, int PageSize = 20)
        {
            _logger.LogInformation("ShuffleFilms endpoint hit.");
            try
            {
                return Ok(await _service.ShuffleFilms(UserId, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user")]
        [AllowAnonymous]
        public async Task<IActionResult> GetFilmsByUser(string UserId, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "DATE WATCHED", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetFilmsByUser endpoint hit with UserId: {UserId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                return Ok(await _service.GetFilmsByUser(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
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
        [AllowAnonymous]
        public async Task<IActionResult> SearchFilms(string Search, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"SearchFilms endpoint hit with: {Search}");
            try
            {
                return Ok(await _service.SearchFilms(Search, Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
