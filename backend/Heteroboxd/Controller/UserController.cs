using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        [HttpGet("{UserId}")]
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

        [HttpGet("{UserId}/subsequent")]
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

        [HttpGet("watchlist/{UserId}")]
        [Authorize]
        public async Task<IActionResult> GetUserWatchlist(string UserId, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "DATE ADDED", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetUserWatchlist endpoint hit for User: {UserId}");
            try
            {
                var Response = await _service.GetWatchlist(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-relationships/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserRelationships(string UserId, int FollowersPage = 1, int FollowingPage = 1, int BlockedPage = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GetUserRelationships endpoint hit for UserId: {UserId}");
            try
            {
                var Response = await _service.GetRelationships(UserId, FollowersPage, FollowingPage, BlockedPage, PageSize);
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

        [HttpGet("user-likes/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserLikes(string UserId, int ReviewsPage = 1, int ListsPage = 1, int PageSize = 32)
        {
            _logger.LogInformation($"GetUserLikes endpoint hit for UserId: {UserId}");
            try
            {
                var Response = await _service.GetLikes(UserId, ReviewsPage, ListsPage, PageSize);
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

        [HttpGet("{UserId}/interactions/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> GetUserFilmInteractions(string UserId, int FilmId)
        {
            _logger.LogInformation($"GetUserFilmInteractions endpoint hit for: {UserId}, {FilmId}");
            try
            {
                return Ok(
                    new 
                    { 
                        Uwf = await _service.DidUserWatchFilm(UserId, FilmId),
                        Watchlisted = await _service.IsFilmWatchlisted(UserId, FilmId),
                        Review = await _reviewService.GetReviewByUserFilm(UserId, FilmId),
                        Friends = await _service.GetFriendsForFilm(UserId, FilmId) 
                    });
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("friends")]
        [Authorize]
        public async Task<IActionResult> GetFriendActivity(string UserId, int Page = 1, int PageSize = 4, string Sort = "DATE CREATED", bool Desc = true)
        {
            _logger.LogInformation($"GetFriendActivity endpoint hit for User: {UserId}");
            try
            {
                return Ok(
                new
                {
                    Reviews = await _reviewService.GetReviews(UserId, Page, PageSize, "FRIENDS", Sort, Desc, null),
                    Lists = await _userListService.GetLists(UserId, Page, PageSize, "FRIENDS", Sort, Desc, null)
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
                var Response = await _service.SearchUsers(Search, Page, PageSize);
                return Ok(Response);
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
                var Response = await _service.UpdateUser(Request);
                return Ok(new { PresignedUrl = Response });
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

        [HttpPut("verify/{UserId}")]
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

        [HttpPut("report/{UserId}")]
        [Authorize]
        public async Task<IActionResult> ReportUser(string UserId)
        {
            _logger.LogInformation($"ReportUser endpoint hit with UserId: {UserId}");
            try
            {
                await _service.ReportUserEfCore7Async(UserId);
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

        [HttpPut("watchlist/{UserId}/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> UpdateWatchlist(string UserId, int FilmId)
        {
            _logger.LogInformation($"UpdateWatchlist endpoint hit for User: {UserId}, Film: {FilmId}");
            try
            {
                await _service.UpdateWatchlist(UserId, FilmId);
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

        [HttpPut("favorites/{UserId}/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> UpdateFavorites(string UserId, int FilmId, int Index)
        {
            _logger.LogInformation($"UpdateFavorites endpoint hit for User: {UserId}");
            try
            {
                if (FilmId < 0)
                {
                    var UpdatedFavorites = await _service.UpdateFavorites(UserId, null, Index);
                    return Ok(UpdatedFavorites);
                }
                else
                {
                    var UpdatedFavorites = await _service.UpdateFavorites(UserId, FilmId, Index);
                    return Ok(UpdatedFavorites);
                }
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

        [HttpPut("relationships/{UserId}/{TargetId}")]
        [Authorize]
        public async Task<IActionResult> UpdateRelationships(string UserId, string TargetId, string Action)
        {
            _logger.LogInformation($"UpdateRelationships endpoint hit with originator {UserId}, target {TargetId}, action = {Action}");
            try
            {
                await _service.UpdateRelationship(UserId, TargetId, Action); //also handles notifs
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

        [HttpPut("track-film/{UserId}/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> TrackFilm(string UserId, int FilmId, string Action)
        {
            _logger.LogInformation($"TrackFilm endpoint hint for User: {UserId}, Film: {FilmId}; action: {Action}");
            try
            {
                await _service.TrackFilm(UserId, FilmId, Action);
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

        [HttpDelete("{UserId}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(string UserId)
        {
            _logger.LogInformation($"DeleteUser endpoint hit with UserId: {UserId}");
            try
            {
                await _service.DeleteUser(UserId);
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
