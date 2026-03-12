using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _service;
        private readonly IReviewService _reviewService;
        private readonly IUserListService _userListService;
        private readonly IFilmService _filmService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService service, IReviewService reviewService, IUserListService userListService, IFilmService filmService, ILogger<UserController> logger)
        {
            _service = service;
            _reviewService = reviewService;
            _userListService = userListService;
            _filmService = filmService;
            _logger = logger;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetUser(string UserId, bool Inclusive = false, string? VisitorId = null)
        {
            _logger.LogInformation($"GetUser endpoint hit with UserId: {UserId}");
            try
            {
                if (Inclusive)
                {
                    return Ok(
                    new
                    {
                        Profile = await _service.GetUser(UserId),
                        Ratings = await _service.GetUserRatings(UserId),
                        Relationship = VisitorId == null ? "" : await _service.DetermineRelationship(VisitorId, UserId)
                    });
                }
                else
                {
                    return Ok(await _service.GetUser(UserId));
                }
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
        public async Task<IActionResult> GetUserSubsequent(string UserId, int PageSize = 8)
        {
            _logger.LogInformation($"GetUserSubsequent endpoint hit with UserId: {UserId}");
            try
            {
                return Ok(
                new
                {
                    Favorites = await _service.GetFavorites(UserId),
                    Recents = await _filmService.GetFilmsByUser(UserId, 1, PageSize, "ALL", "DATE WATCHED", true, null)
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

        [HttpGet("watchlist")]
        [Authorize]
        public async Task<IActionResult> GetUserWatchlist(int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "DATE ADDED", bool Desc = true, string? FilterValue = null)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"GetUserWatchlist endpoint hit for User: {UserId}");
            try
            {
                return Ok(await _service.GetWatchlist(UserId!, Page, PageSize, Filter, Sort, Desc, FilterValue));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("relationships")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserRelationships(string UserId, int FollowersPage = 1, int FollowingPage = 1, int BlockedPage = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GetUserRelationships endpoint hit for UserId: {UserId}");
            try
            {
                return Ok(await _service.GetRelationships(UserId, FollowersPage, FollowingPage, BlockedPage, PageSize));
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

        [HttpGet("likes")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserLikes(string UserId, int ReviewsPage = 1, int ListsPage = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GetUserLikes endpoint hit for UserId: {UserId}");
            try
            {
                return Ok(await _service.GetLikes(UserId, ReviewsPage, ListsPage, PageSize));
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

        [HttpGet("interactions/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> GetUserFilmInteractions(int FilmId)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"GetUserFilmInteractions endpoint hit for: {UserId}, {FilmId}");
            try
            {
                return Ok(
                    new 
                    { 
                        Uwf = await _service.DidUserWatchFilm(UserId!, FilmId),
                        Watchlisted = await _service.IsFilmWatchlisted(UserId!, FilmId),
                        Review = await _reviewService.GetReviewByUserFilm(UserId!, FilmId),
                        Friends = await _service.GetFriendsForFilm(UserId!, FilmId) 
                    });
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("friends")]
        [Authorize]
        public async Task<IActionResult> GetFriendActivity(int Page = 1, int PageSize = 4, string Sort = "DATE CREATED", bool Desc = true)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"GetFriendActivity endpoint hit for User: {UserId}");
            try
            {
                return Ok(
                new
                {
                    Reviews = await _reviewService.GetReviews(UserId!, Page, PageSize, "FRIENDS", Sort, Desc, null),
                    Lists = await _userListService.GetLists(UserId!, Page, PageSize, "FRIENDS", Sort, Desc, null)
                });
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchUsers(string Search, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"SearchUsers endpoint hit with Search: {Search}");
            try
            {
                return Ok(await _service.SearchUsers(Search, Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateUser(UpdateUserRequest Request)
        {
            _logger.LogInformation($"UpdateUser endpoint hit with UserId: {Request.UserId}");
            try
            {
                return Ok(new { PresignedUrl = await _service.UpdateUser(Request) });
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

        [HttpPut("verify")]
        [AllowAnonymous]
        public async Task<IActionResult> Verify(string UserId, string Token)
        {
            _logger.LogInformation($"Verify endpoint hit with UserId: {UserId} and Token: {Token}");
            try
            {
                await _service.VerifyUser(UserId, Token);
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
        public async Task<IActionResult> ReportUser(string UserId)
        {
            _logger.LogInformation($"ReportUser endpoint hit with UserId: {UserId}");
            try
            {
                await _service.ReportAsync(UserId);
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

        [HttpPut("watchlist")]
        [Authorize]
        public async Task<IActionResult> UpdateWatchlist(int FilmId)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"UpdateWatchlist endpoint hit for User: {UserId}, Film: {FilmId}");
            try
            {
                await _service.UpdateWatchlist(UserId!, FilmId);
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

        [HttpPut("favorites")]
        [Authorize]
        public async Task<IActionResult> UpdateFavorites(int FilmId, int Index)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"UpdateFavorites endpoint hit for User: {UserId}");
            try
            {
                return Ok(FilmId < 0
                ? await _service.UpdateFavorites(UserId!, null, Index)
                : await _service.UpdateFavorites(UserId!, FilmId, Index)
                );
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentOutOfRangeException)
            {
                return BadRequest();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut("relationships")]
        [Authorize]
        public async Task<IActionResult> UpdateRelationships(string TargetId, string Action)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"UpdateRelationships endpoint hit with originator {UserId}, target {TargetId}, action = {Action}");
            try
            {
                await _service.UpdateRelationship(UserId!, TargetId, Action);
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

        [HttpPut("track/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> TrackFilm(int FilmId, string Action)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"TrackFilm endpoint hint for User: {UserId}, Film: {FilmId}; action: {Action}");
            try
            {
                await _service.TrackFilm(UserId!, FilmId, Action);
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

        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> DeleteUser()
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"DeleteUser endpoint hit with UserId: {UserId}");
            try
            {
                await _service.DeleteUser(UserId!);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
