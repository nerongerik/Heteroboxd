using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.API.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Heteroboxd.API.Controller
{
    [ApiController]
    [Route("api/lists")]
    public class UserListController : ControllerBase
    {
        private readonly IUserListService _service;
        private readonly IUserService _userService;
        private readonly ILogger<UserListController> _logger;

        public UserListController(IUserListService service,  ILogger<UserListController> logger, IUserService userService)
        {
            _service = service;
            _logger = logger;
            _userService = userService;
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetLists(string? UserId, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "POPULARITY", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation("GetLists endpoint hit.");
            try
            {
                return Ok(await _service.GetLists(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetList(string UserListId, string? UserId = null)
        {
            _logger.LogInformation($"GetList endpoint hit with ListId: {UserListId}");
            try
            {
                return UserId == null
                ? Ok(await _service.GetList(UserListId))
                : Ok(new { List = await _service.GetList(UserListId), ILiked = await _userService.IsObjectLiked(UserId, UserListId, "list") });
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

        [HttpGet("entries")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListEntries(string UserListId, string? UserId = null, int Page = 1, int PageSize = 48, string Filter = "ALL", string Sort = "POSITION", bool Desc = false, string? FilterValue = null)
        {
            _logger.LogInformation($"GetListEntries endpoint hit for ListId: {UserListId}");
            try
            {
                return Ok(await _service.GetListEntries(UserListId, UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("power")]
        [Authorize]
        public async Task<IActionResult> PowerGetEntries(string UserListId)
        {
            _logger.LogInformation($"PowerGetEntries endpoint hit for ListId: {UserListId}");
            try
            {
                return Ok(await _service.PowerGetEntries(UserListId));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListsByAuthor(string UserId, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "DATE CREATED", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetListsByAuthor endpoint hit for User: {UserId}");
            try
            {
                return Ok(await _service.GetListsByUser(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
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

        [HttpGet("film-interact")]
        [Authorize]
        public async Task<IActionResult> GetAuthorsListsDelimitedFilm(int FilmId, int Page = 1, int PageSize = 20)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"GetAuthorsListsDelimitedFilm endpoint hit for User: {UserId} delimited by Film: {FilmId}");
            try
            {
                return Ok(await _service.GetDelimitedLists(UserId!, FilmId, Page, PageSize));
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

        [HttpGet("featuring")]
        [AllowAnonymous]
        public async Task<IActionResult> GetListsFeaturingFilm(int FilmId, string? UserId = null, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "POPULARITY", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetListsFeaturingFilm endpoint hit for FilmId: {FilmId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                return Ok(await _service.GetListsFeaturingFilm(FilmId, UserId, Page, PageSize, Filter, Sort, Desc, FilterValue));
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
        [AllowAnonymous]
        public async Task<IActionResult> SearchLists(string Search, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"SearchLists endpoint hit with Search Term: {Search}");
            try
            {
                return Ok(await _service.SearchLists(Search, Page, PageSize));
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
        public async Task<IActionResult> AddList(CreateUserListRequest ListRequest)
        {
            _logger.LogInformation($"AddList endpoint hit with AuthorId: {ListRequest.AuthorId}");
            try
            {
                await _service.AddList(ListRequest);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateList(UpdateUserListRequest ListRequest)
        {
            _logger.LogInformation($"UpdateList endpoint hit for ListId: {ListRequest.ListId}");
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

        [HttpPut("bulk")]
        [Authorize]
        public async Task<IActionResult> UpdateListsBulk(UpdateUserListBulkRequest Request)
        {
            _logger.LogInformation($"UpdateListsBulk endpoint hit for FilmId: {Request.FilmId}");
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

        [HttpPut("like")]
        [Authorize]
        public async Task<IActionResult> UpdateLikes(UpdateUserLikesRequest Request)
        {
            _logger.LogInformation($"UpdateLikes endpoint hit for {Request.ListId!}");
            try
            {
                await _service.UpdateListLikeCount(Request.ListId!, Request.LikeChange);
                await _userService.UpdateLikes(Request);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentNullException)
            {
                return BadRequest();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut("notifs")]
        [Authorize]
        public async Task<IActionResult> ToggleNotifications(string UserListId)
        {
            _logger.LogInformation($"ToggleNotifications endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.ToggleListNotifications(UserListId);
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

        [HttpPut("report")]
        [Authorize]
        public async Task<IActionResult> ReportList(string UserListId)
        {
            _logger.LogInformation($"ReportList endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.ReportList(UserListId);
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

        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> DeleteList(string UserListId)
        {
            _logger.LogInformation($"DeleteList endpoint hit for ListId: {UserListId}");
            try
            {
                await _service.DeleteList(UserListId);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
