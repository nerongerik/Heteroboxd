using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/lists")]
    public class UserListController : ControllerBase
    {
        private readonly IUserListService _service;
        private readonly ILogger<UserListController> _logger;

        public UserListController(IUserListService service, ILogger<UserListController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("{UserListId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetList(string UserListId)
        {
            _logger.LogInformation($"GET List endpoint hit with ListId: {UserListId}");
            try
            {
                var Response = await _service.GetList(UserListId);
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

        [HttpGet("entries/{UserListId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListEntries(string UserListId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET ListEntries endpoint hit for ListId: {UserListId}");
            try
            {
                var Response = await _service.GetListEntries(UserListId, Page, PageSize);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("power/{UserListId}")]
        [Authorize]
        public async Task<IActionResult> PowerGetEntries(string UserListId)
        {
            _logger.LogInformation($"GET (Power) ListEntries endpoint hit for ListId: {UserListId}");
            try
            {
                var Response = await _service.PowerGetEntries(UserListId);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListsByAuthor(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Lists by Author endpoint hit for User: {UserId}");
            try
            {
                var UsersLists = await _service.GetListsByUser(UserId, Page, PageSize);
                return Ok(UsersLists);
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

        [HttpGet("film-interact/{UserId}/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> GetAuthorsListsDelimitedFilm(string UserId, int FilmId)
        {
            _logger.LogInformation($"GET Lists of User: {UserId} delimited by Film: {FilmId}");
            try
            {
                var Result = await _service.GetDelimitedLists(UserId, FilmId);
                return Ok(Result);
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

        [HttpGet("featuring-film/{FilmId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListsFeaturingFilm(int FilmId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Lists featuring Film endpoint hit for FilmId: {FilmId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                var FilmsLists = await _service.GetListsFeaturingFilm(FilmId, Page, PageSize);
                return Ok(FilmsLists);
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

        [HttpGet("featuring-film/{FilmId}/count")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListsFeaturingFilmCount(int FilmId)
        {
            _logger.LogInformation($"GET Lists featuring Film COUNT endpoint hit for FilmId: {FilmId}");
            try
            {
                var Count = await _service.GetListsFeaturingFilmCount(FilmId);
                return Ok(Count);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchLists([FromQuery] string Search)
        {
            _logger.LogInformation($"GET Search Lists endpoint hit with Search Term: {Search}");
            try
            {
                var SearchResults = await _service.SearchLists(Search);
                return Ok(SearchResults);
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

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddList([FromBody] CreateUserListRequest ListRequest)
        {
            _logger.LogInformation($"POST List endpoint hit with AuthorId: {ListRequest.AuthorId}");
            try
            {
                Guid ListId = await _service.AddList(ListRequest.Name, ListRequest.Description, ListRequest.Ranked, ListRequest.AuthorId);
                await _service.AddListEntries(ListRequest.AuthorId, ListId, ListRequest.Entries);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateList([FromBody] UpdateUserListRequest ListRequest)
        {
            _logger.LogInformation($"PUT List endpoint hit for ListId: {ListRequest.ListId}");
            try
            {
                await _service.UpdateList(ListRequest);
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

        [HttpPut("update-bulk")]
        [Authorize]
        public async Task<IActionResult> UpdateListsBulk([FromBody] BulkUpdateRequest Request)
        {
            _logger.LogInformation($"PUT (Bulk) Update Lists endpoint hit for FilmId: {Request.FilmId}");
            try
            {
                await _service.UpdateListsBulk(Request);
                return Ok();
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

        [HttpPut("like-count/{UserListId}/{LikeChange}")]
        [Authorize]
        public async Task<IActionResult> UpdateLikeCount(string UserListId, string LikeChange)
        {
            _logger.LogInformation($"PUT Like Count endpoint hit for ListId: {UserListId} with Change: {LikeChange}");
            try
            {
                await _service.UpdateLikeCountEfCore7(UserListId, LikeChange);
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

        [HttpPut("toggle-notifications/{UserListId}")]
        [Authorize]
        public async Task<IActionResult> ToggleNotifications(string UserListId)
        {
            _logger.LogInformation($"PUT Toggle Notifications endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.ToggleNotificationsEfCore7(UserListId);
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

        [HttpDelete("{UserListId}")]
        [Authorize]
        public async Task<IActionResult> DeleteList(string UserListId)
        {
            _logger.LogInformation($"DELETE List endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.DeleteList(UserListId);
                return Ok();
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
    }
}
