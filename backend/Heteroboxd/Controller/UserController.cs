using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
        public async Task<IActionResult> GetUser(string UserId)
        {
            //retrives specific user from database
            try
            {
                var User = await _service.GetUser(UserId);
                return User == null ? NotFound() : Ok(User);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-watchlist/{UserId}")]
        public async Task<IActionResult> GetUserWatchlist(string UserId)
        {
            //retrives a specific user's watchlist from database
            try
            {
                var Watchlist = await _service.GetWatchlist(UserId);
                return Ok(Watchlist);
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

        [HttpGet("user-favorites/{UserId}")]
        public async Task<IActionResult> GetUserFavorites(string UserId)
        {
            //retrives a specific user's favorites from database
            try
            {
                var Favorites = await _service.GetFavorites(UserId);
                return Ok(Favorites);
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

        [HttpGet("user-relationships/{UserId}")]
        public async Task<IActionResult> GetUserRelationships(string UserId)
        {
            //retrives a specific user's relationships (followers, following, blocked) from database
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

        [HttpGet("user-reports/{UserId}")]
        public async Task<IActionResult> GetUserReports(string UserId)
        {
            //retrives a specific user's reports from database - ADMIN ACCESS ONLY
            try
            {
                var Reports = await _service.GetReports(UserId);
                return Ok(Reports);
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

        //POST endpoints -> public access

        [HttpPost("report")]
        public async Task<IActionResult> ReportUser([FromBody] ReportUserRequest ReportRequest)
        {
            //creates a report against a user
            try
            {
                await _service.ReportUser(ReportRequest);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //PUT endpoints -> protected, user can only modify their own data

        [HttpPut]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest Request)
        {
            //updates a specific user's data in the database
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

        [HttpPut("watchlist/{UserId}/{FilmId}")]
        public async Task<IActionResult> UpdateUserWatchlist(string UserId, string FilmId)
        {
            //adds or removes a film from the user's watchlist
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
        public async Task<IActionResult> UpdateUserFavorites(string UserId, [FromBody] List<string> FilmIds)
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
        public async Task<IActionResult> UpdateUserRelationships(string UserId, string TargetId, [FromQuery] string Action)
        {
            //actions: ?action=follow-unfollow / block-unblock / add-remove-follower
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
        public async Task<IActionResult> TrackUserFilm(string UserId, string FilmId, [FromQuery] string Action)
        {
            //actions: ?action=watched/rewatched/unwatched
            //for the frontend: never delete a UserWatchedFilm, just set the times watched to 0 when unwatched is triggered. display films differently based on this value
            try
            {
                await _service.TrackFilm(UserId, FilmId, Action);
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
        public async Task<IActionResult> DeleteUser(string UserId)
        {
            //logically deletes a specific user from the database and revokes his tokens
            try
            {
                await _service.LogicalDeleteUser(UserId);
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
