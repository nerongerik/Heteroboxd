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
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService service, ILogger<UserController> logger)
        {
            _service = service;
            _logger = logger;
        }

        //GET endpoints -> limited public access

        [HttpGet]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetAllUsers()
        {
            //retrives all users from database
            try
            {
                var AllUsers = await _service.GetAllUsers();
                return Ok(AllUsers);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("{UserId}")]
        [AllowAnonymous] //Heteroboxd is an open-access app, anyone can search through the community
        public async Task<IActionResult> GetUser(string UserId)
        {
            _logger.LogInformation($"GetUser endpoint hit with UserId: {UserId}");
            try
            {
                var User = await _service.GetUser(UserId);
                return User == null ? NotFound() : Ok(User);
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

        [HttpGet("watchlist/{UserId}")]
        [Authorize] //you can only see your own watchlist
        public async Task<IActionResult> GetUserWatchlist(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"Get Watchlist endpoint hit for User: {UserId}");
            try
            {
                var Response = await _service.GetWatchlist(UserId, Page, PageSize);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-favorites/{UserId}")]
        [AllowAnonymous] //must be open so non-logged in users can see other members' profiles
        public async Task<IActionResult> GetUserFavorites(string UserId)
        {
            _logger.LogInformation($"Get Favorites enpoint hit with UserId: {UserId}");
            try
            {
                var Favorites = await _service.GetFavorites(UserId);
                return Ok(Favorites);
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

        [HttpGet("user-relationships/{UserId}")]
        [AllowAnonymous] //anyone can visit anyone's profile and see their following and followers
        public async Task<IActionResult> GetUserRelationships(string UserId)
        {
            _logger.LogInformation($"Get Relationships endpoint hit for UserId: {UserId}");
            try
            {
                var Relationships = await _service.GetRelationships(UserId);
                return Ok(Relationships);
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
        public async Task<IActionResult> GetUserLikes(string UserId)
        {
            //retrives a specific user's likes (reviews, comments, lists) from database
            try
            {
                var Likes = await _service.GetLikes(UserId);
                return Ok(Likes);
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

        [HttpGet("uwf/{UserId}/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> GetUserWatchedFilm(string UserId, int FilmId)
        {
            _logger.LogInformation($"GET UWF endpoint hit for: {UserId}, {FilmId}");
            try
            {
                var UserWatchedFilm = await _service.GetUserWatchedFilm(UserId, FilmId);
                return UserWatchedFilm == null ? NotFound() : Ok(UserWatchedFilm);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string Search)
        {
            //searches for user, probably simpled name-based search
            try
            {
                var Results = await _service.SearchUsers(Search);
                return Ok(Results);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //PUT endpoints -> protected, user can only modify their own data

        [HttpPut]
        [Authorize] //need to be logged in to perform CUDs
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest Request)
        {
            _logger.LogInformation($"Update endpoint hit with UserId: {Request.UserId}");
            try
            {
                await _service.UpdateUser(Request);
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

        [HttpPut("verify")]
        [AllowAnonymous]
        public async Task<IActionResult> Verify([FromBody] VerifyUserRequest Request)
        {
            _logger.LogInformation($"Verify endpoint hit with UserId: {Request.UserId} and Token: {Request.Token}");
            try
            {
                await _service.VerifyUser(Request.UserId, Request.Token);
                _logger.LogInformation($"Verified User with Id: {Request.UserId}");
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
        [Authorize] //need to be logged in to report users
        public async Task<IActionResult> ReportUser(string UserId)
        {
            _logger.LogInformation($"Report endpoint hit with UserId: {UserId}");
            try
            {
                await _service.ReportUserEfCore7Async(UserId);
                return Ok();
            }
            catch (ArgumentException)
            {
                return BadRequest();
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
        [Authorize] //only own watchlist can be modified
        public async Task<IActionResult> UpdateUserWatchlist(string UserId, int FilmId)
        {
            _logger.LogInformation($"Update Watchlist endpoint hit for User: {UserId}, Film: {FilmId}");
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

        [HttpPut("favorites/{UserId}")]
        public async Task<IActionResult> UpdateUserFavorites(string UserId, [FromBody] List<int?> FilmIds)
        {
            //updates the user's top 5 films
            try
            {
                await _service.UpdateFavorites(UserId, FilmIds);
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

        [HttpPut("relationships/{UserId}/{TargetId}")]
        [Authorize] //need to be logged in to perform CUDs
        public async Task<IActionResult> UpdateUserRelationships(string UserId, string TargetId, [FromQuery] string Action)
        {
            _logger.LogInformation($"Update Relationship endpoint hit with originator {UserId}, target {TargetId}\nAction = {Action}");
            try
            {
                await _service.UpdateRelationship(UserId, TargetId, Action);
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

        [HttpPut("likes")]
        public async Task<IActionResult> UpdateUserLikes(UpdateUserLikesRequest Request)
        {
            //updates the user's likes (reviews, comments, lists)
            try
            {
                await _service.UpdateLikes(Request);
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
        public async Task<IActionResult> TrackUserFilm(string UserId, int FilmId, [FromQuery] string Action)
        {
            //actions: ?action=watched/rewatched/unwatched
            _logger.LogInformation($"Track Film endpoint hint for User: {UserId}, Film: {FilmId}; action: {Action}");
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

        [HttpPut("donate")]
        public async Task<IActionResult> Donate([FromBody] DonateRequest DonateRequest)
        {
            //processes a donation from a user
            try
            {
                //await _service.ProcessDonation(DonateRequest);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //DELETE endpoints -> limited private access, ADMIN can delete any user, user can delete their own account

        [HttpDelete("{UserId}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(string UserId)
        {
            _logger.LogInformation($"Delete endpoint hit with UserId: {UserId}");
            try
            {
                await _service.LogicalDeleteUser(UserId);
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
