using Heteroboxd.API.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.API.Controller
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IUserListService _userListService;
        private readonly IReviewService _reviewService;
        private readonly ICommentService _commentService;

        public AdminController(IUserService userService, IUserListService userListService, IReviewService reviewService, ICommentService commentService)
        {
            _userService = userService;
            _userListService = userListService;
            _reviewService = reviewService;
            _commentService = commentService;
        }

        [HttpGet("users")]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetFlaggedUsers(int Page = 1, int PageSize = 20)
        {
            try
            {
                return Ok(await _userService.GetUsers(Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("lists")]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetFlaggedLists(int Page = 1, int PageSize = 20)
        {
            try
            {
                return Ok(await _userListService.GetLists(null, Page, PageSize, "ALL", "FLAGS", true, null));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("reviews")]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetFlaggedReviews(int Page = 1, int PageSize = 20)
        {
            try
            {
                return Ok(await _reviewService.GetReviews("", Page, PageSize, "ALL", "FLAGS", true, null));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("comments")]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetFlaggedComments(int Page = 1, int PageSize = 20)
        {
            try
            {
                return Ok(await _commentService.GetComments(Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> Search(string Context, string Id)
        {
            try
            {
                switch (Context)
                {
                    case "user":
                        return Ok(await _userService.GetUser(Id));
                    case "list":
                        return Ok(await _userListService.GetList(Id));
                    case "review":
                        return Ok(await _reviewService.GetReview(Id));
                    case "comment":
                        return Ok(await _commentService.GetComment(Id));
                    default:
                        return BadRequest();
                }
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpDelete]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> AdminDelete(string Context, string Id)
        {
            try
            {
                switch (Context)
                {
                    case "user":
                        await _userService.DeleteUser(Id);
                        break;
                    case "list":
                        await _userListService.DeleteList(Id);
                        break;
                    case "review":
                        await _reviewService.DeleteReview(Id);
                        break;
                    case "comment":
                        await _commentService.DeleteComment(Id);
                        break;
                    default:
                        return BadRequest();
                }
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
