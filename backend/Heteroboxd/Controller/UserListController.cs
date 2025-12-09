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

        //GET endpoints -> limited public access

        [HttpGet("{UserListId}")]
        [AllowAnonymous] //anyone can view any list...
        public async Task<IActionResult> GetList(string UserListId)
        {
            _logger.LogInformation($"Get List endpoint hit with ListId: {UserListId}");
            try
            {
                var Response = await _service.GetUserListById(UserListId);
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
        [AllowAnonymous] //...and its contents
        public async Task<IActionResult> GetListEntries(string UserListId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"Get ListEntries endpoint hit for ListId: {UserListId}");
            try
            {
                var Response = await _service.GetListEntriesById(UserListId, Page, PageSize);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("power/{UserListId}")]
        [Authorize] //to get a full editable list of entries without pagination, must be logged in
        public async Task<IActionResult> PowerGetEntries(string UserListId)
        {
            _logger.LogInformation($"POWERGet ListEntries endpoint hit for ListId: {UserListId}");
            try
            {
                var Response = await _service.PowerGetEntriesByListId(UserListId);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user/{UserId}")]
        [AllowAnonymous] //anyone can view any user's lists
        public async Task<IActionResult> GetListsByAuthor(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"Get Lists by Author endpoint hit for User: {UserId}");
            try
            {
                var UsersLists = await _service.GetUsersUserLists(UserId, Page, PageSize);
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
        [Authorize] //only logged in users can view their own lists (where a film can be added)
        public async Task<IActionResult> GetAuthorsListsDelimitedFilm(string UserId, int FilmId)
        {
            _logger.LogInformation($"Get Lists of User: {UserId} delimited by Film: {FilmId}");
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
        [AllowAnonymous] //anyone can view lists featuring a specific film
        public async Task<IActionResult> GetListsFeaturingFilm(int FilmId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"Get Lists featuring Film endpoint hit for FilmId: {FilmId}, Page: {Page}, PageSize: {PageSize}");
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
        [AllowAnonymous] //anyone can view how many lists feature a specific film
        public async Task<IActionResult> GetListsFeaturingFilmCount(int FilmId)
        {
            _logger.LogInformation($"Get Lists featuring Film COUNT endpoint hit for FilmId: {FilmId}");
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
        public async Task<IActionResult> SearchLists([FromQuery] string Search)
        {
            //searches lists by name
            try
            {
                var SearchResults = await _service.SearchUserLists(Search);
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

        //POST endpoints -> public access

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddList([FromBody] CreateUserListRequest ListRequest)
        {
            _logger.LogInformation($"Create List endpoint hit with AuthorId: {ListRequest.AuthorId}");
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

        //PUT endpoints -> limited public access (only for their own lists)

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateList([FromBody] UpdateUserListRequest ListRequest)
        {
            _logger.LogInformation($"Update List endpoint hit for ListId: {ListRequest.ListId}");
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
            _logger.LogInformation($"Bulk Update Lists endpoint hit for FilmId: {Request.FilmId}");
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
        [Authorize] //only logged in users can like/dislike lists
        public async Task<IActionResult> UpdateLikeCount(string UserListId, string LikeChange)
        {
            //LikeChange should be +1 or -1 (convert to numeral)
            _logger.LogInformation($"Update Like Count endpoint hit for ListId: {UserListId} with Change: {LikeChange}");
            try
            {
                await _service.UpdateLikeCountEfCore7Async(UserListId, LikeChange);
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
            _logger.LogInformation($"Toggle Notifications endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.ToggleNotificationsEfCore7Async(UserListId);
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

        //DELETE endpoints -> limited public access (only for their own lists), ADMIN privileges for any list
        [HttpDelete("{UserListId}")]
        [Authorize]
        public async Task<IActionResult> DeleteList(string UserListId)
        {
            _logger.LogInformation($"Delete List endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.DeleteUserList(UserListId);
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
