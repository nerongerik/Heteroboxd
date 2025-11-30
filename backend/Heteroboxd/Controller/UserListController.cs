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

        /*
        [HttpGet]
        public async Task<IActionResult> GetAllLists()
        {
            //retrives all lists from database
            try
            {
                var AllLists = await _service.GetAllUserLists();
                return Ok(AllLists);
            }
            catch
            {
                return StatusCode(500);
            }
        }
        */

        [HttpGet("{UserListId}")]
        public async Task<IActionResult> GetList(string UserListId)
        {
            //retrives specific list from database
            try
            {
                var List = await _service.GetUserListById(UserListId);
                return Ok(List);
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

        [HttpGet("user/{UserId}")]
        [AllowAnonymous]
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

        [HttpGet("featuring-film/{FilmId}")]
        public async Task<IActionResult> GetListsFeaturingFilm(int FilmId)
        {
            //retrives all lists featuring a specific film from database
            try
            {
                var FilmsLists = await _service.GetListsFeaturingFilm(FilmId);
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
        public async Task<IActionResult> UpdateList([FromBody] UpdateUserListRequest ListRequest)
        {
            //updates an existing list in the database
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

        [HttpPut("like-count/{UserListId}/{LikeChange}")]
        public async Task<IActionResult> UpdateLikeCount(string UserListId, string LikeChange)
        {
            //updates the like count of a list
            //LikeChange should be +1 or -1 (convert to numeral)
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
        public async Task<IActionResult> ToggleNotifications(string UserListId)
        {
            //toggles the notifications setting for the list
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
        public async Task<IActionResult> DeleteList(string UserListId)
        {
            //deletes a list from the database (logical delete)
            //normal users can only delete their own lists, admins can delete any list
            try
            {
                await _service.LogicalDeleteUserList(UserListId);
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
