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

        [HttpGet("{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUser(string UserId)
        {
            _logger.LogInformation($"GET User endpoint hit with UserId: {UserId}");
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
        [Authorize]
        public async Task<IActionResult> GetUserWatchlist(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Watchlist endpoint hit for User: {UserId}");
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

        [HttpGet("{UserId}/watchlist/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> IsFilmWatchlisted(string UserId, int FilmId)
        {
            _logger.LogInformation($"GET isWatchlisted endpoint hit for User: {UserId}");
            try
            {
                var Response = await _service.IsFilmWatchlisted(UserId, FilmId);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-favorites/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserFavorites(string UserId)
        {
            _logger.LogInformation($"GET Favorites enpoint hit with UserId: {UserId}");
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
        [AllowAnonymous]
        public async Task<IActionResult> GetUserRelationships(string UserId)
        {
            _logger.LogInformation($"GET Relationships endpoint hit for UserId: {UserId}");
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
        [AllowAnonymous]
        public async Task<IActionResult> GetUserLikes(string UserId)
        {
            _logger.LogInformation($"GET Likes endpoint hit for UserId: {UserId}");
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

        [HttpGet("{UserId}/liked/{ObjectId}")]
        [Authorize]
        public async Task<IActionResult> IsObjectLiked(string UserId, string ObjectId, [FromQuery] string ObjectType)
        {
            //ObjectType: review, comment, list
            _logger.LogInformation($"GET isLiked endpoint hit for User: {UserId}");
            try
            {
                var Response = await _service.IsObjectLiked(UserId, ObjectId, ObjectType);
                return Ok(Response);
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
        [AllowAnonymous]
        public async Task<IActionResult> SearchUsers([FromQuery] string Search)
        {
            _logger.LogInformation($"GET Search Users endpoint hit with Search: {Search}");
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

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest Request)
        {
            _logger.LogInformation($"PUT User endpoint hit with UserId: {Request.UserId}");
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
            _logger.LogInformation($"PUT Verify endpoint hit with UserId: {Request.UserId} and Token: {Request.Token}");
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
        [Authorize]
        public async Task<IActionResult> ReportUser(string UserId)
        {
            _logger.LogInformation($"PUT Report endpoint hit with UserId: {UserId}");
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
        [Authorize]
        public async Task<IActionResult> UpdateUserWatchlist(string UserId, int FilmId)
        {
            _logger.LogInformation($"PUT Watchlist endpoint hit for User: {UserId}, Film: {FilmId}");
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
        [Authorize]
        public async Task<IActionResult> UpdateUserFavorites(string UserId, [FromBody] List<int?> FilmIds)
        {
            _logger.LogInformation($"PUT Favorites endpoint hit for User: {UserId}");
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
        [Authorize]
        public async Task<IActionResult> UpdateUserRelationships(string UserId, string TargetId, [FromQuery] string Action)
        {
            _logger.LogInformation($"PUT Relationship endpoint hit with originator {UserId}, target {TargetId}\nAction = {Action}");
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
        [Authorize]
        public async Task<IActionResult> UpdateUserLikes(UpdateUserLikesRequest Request)
        {
            _logger.LogInformation($"PUT User's Likes endpoint hit for User: {Request.UserId}");
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
            //?action=watched/unwatched
            _logger.LogInformation($"PUT Track Film endpoint hint for User: {UserId}, Film: {FilmId}; action: {Action}");
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
        [Authorize]
        public async Task<IActionResult> Donate([FromBody] DonateRequest DonateRequest)
        {
            _logger.LogInformation($"PUT Donate endpoint hit for User: {DonateRequest.UserId}, Amount: {DonateRequest.Amount}");
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

        [HttpDelete("{UserId}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(string UserId)
        {
            _logger.LogInformation($"DELETE User endpoint hit with UserId: {UserId}");
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
