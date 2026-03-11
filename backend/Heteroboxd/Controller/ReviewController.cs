using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/reviews")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _service;
        private readonly IUserService _userService;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(IReviewService service, ILogger<ReviewController> logger, IUserService userService)
        {
            _service = service;
            _userService = userService;
            _logger = logger;
        }

        [HttpGet("{ReviewId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReview(string ReviewId, string? UserId = null)
        {
            _logger.LogInformation($"GetReview endpoint hit for ReviewId: {ReviewId}");
            try
            {
                var Review = await _service.GetReview(ReviewId);
                if (UserId == null)
                {
                    return Ok(Review);
                }
                else
                {
                    return Ok(
                    new
                    {
                        Review,
                        Uwf = (await _userService.DidUserWatchFilm(UserId, Review.FilmId)) != null,
                        ILiked = await _userService.IsObjectLiked(UserId, ReviewId, "review")
                    });
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

        [HttpGet("{UserId}/{FilmId}")]
        [Authorize]
        public async Task<IActionResult> GetReviewByUserFilm(string UserId, int FilmId)
        {
            _logger.LogInformation($"GetReviewByUserFilm endpoint hit for UserId: {UserId}, FilmId: {FilmId}");
            try
            {
                var Response = await _service.GetReviewByUserFilm(UserId, FilmId);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("film-reviews/{FilmId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByFilm(int FilmId, string? UserId = null, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "POPULARITY", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetReviewsByFilm endpoint hit for FilmId: {FilmId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                if (UserId == null)
                {
                    return Ok(await _service.GetReviewsByFilm(FilmId, null, Page, PageSize, Filter, Sort, Desc, FilterValue));
                }
                else
                {
                    return Ok(
                    new
                    {
                        Reviews = await _service.GetReviewsByFilm(FilmId, UserId, Page, PageSize, Filter, Sort, Desc, FilterValue),
                        Uwf = await _userService.DidUserWatchFilm(UserId, FilmId) != null
                    });
                }
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-reviews/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByAuthor(string UserId, int Page = 1, int PageSize = 20, string Filter = "ALL", string Sort = "DATE CREATED", bool Desc = true, string? FilterValue = null)
        {
            _logger.LogInformation($"GetReviewsByAuthor endpoint hit for UserId: {UserId}");
            try
            {
                var Response = await _service.GetReviewsByAuthor(UserId, Page, PageSize, Filter, Sort, Desc, FilterValue);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddReview(CreateReviewRequest ReviewRequest)
        {
            _logger.LogInformation($"AddReview endpoint hit for User: {ReviewRequest.AuthorId} and Film: {ReviewRequest.FilmId}");
            try
            {
                var Response = await _service.AddReview(ReviewRequest);
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

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateReview(UpdateReviewRequest ReviewRequest)
        {
            _logger.LogInformation($"UpdateReview endpoint hit for ReviewId: {ReviewRequest.ReviewId}");
            try
            {
                var Response = await _service.UpdateReview(ReviewRequest);
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

        [HttpPut("like")]
        [Authorize]
        public async Task<IActionResult> UpdateLikes(UpdateUserLikesRequest Request)
        {
            _logger.LogInformation($"UpdateLikes endpoint hit for {Request.ReviewId!}");
            try
            {
                await _service.UpdateReviewLikeCountEfCore7(Request.ReviewId!, Request.LikeChange);
                await _userService.UpdateLikes(Request); //also handles notifs
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

        [HttpPut("toggle-notifications/{ReviewId}")]
        [Authorize]
        public async Task<IActionResult> ToggleNotifications(string ReviewId)
        {
            _logger.LogInformation($"ToggleNotifications endpoint hit for ReviewId: {ReviewId}");
            try
            {
                await _service.ToggleNotificationsEfCore7(ReviewId);
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

        [HttpPut("report/{ReviewId}")]
        [Authorize]
        public async Task<IActionResult> ReportReview(string ReviewId)
        {
            _logger.LogInformation($"ReportReview endpoint hit for ReviewId: {ReviewId}");
            try
            {
                await _service.ReportReviewEfCore7(ReviewId);
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

        [HttpDelete("{ReviewId}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(string ReviewId)
        {
            _logger.LogInformation($"DeleteReview endpoint hit for ReviewId: {ReviewId}");
            try
            {
                await _service.DeleteReview(ReviewId);
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
