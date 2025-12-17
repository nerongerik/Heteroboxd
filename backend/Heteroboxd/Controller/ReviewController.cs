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
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(IReviewService service, ILogger<ReviewController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("{ReviewId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReview(string ReviewId)
        {
            _logger.LogInformation($"GET Review endpoint hit for ReviewId: {ReviewId}");
            try
            {
                var Review = await _service.GetReview(ReviewId);
                return Ok(Review);
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
            _logger.LogInformation($"GET Review by UserFilm endpoint hit for UserId: {UserId}, FilmId: {FilmId}");
            try
            {
                var Review = await _service.GetReviewByUserFilm(UserId, FilmId);
                return Ok(Review);
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

        [HttpGet("film-reviews/{FilmId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByFilm(int FilmId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Reviews by Film endpoint hit for FilmId: {FilmId}, Page: {Page}, PageSize: {PageSize}");
            try
            {
                var Reviews = await _service.GetReviewsByFilm(FilmId, Page, PageSize);
                return Ok(Reviews);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-reviews/{UserId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByAuthor(string UserId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Reviews by Author endpoint hit for UserId: {UserId}");
            try
            {
                var Reviews = await _service.GetReviewsByAuthor(UserId, Page, PageSize);
                return Ok(Reviews);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddReview([FromBody] CreateReviewRequest ReviewRequest)
        {
            _logger.LogInformation($"POST Review endpoint hit for User: {ReviewRequest.AuthorId} and Film: {ReviewRequest.FilmId}");
            try
            {
                var Review = await _service.AddReview(ReviewRequest);
                return Ok(Review);
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
        public async Task<IActionResult> UpdateReview([FromBody] UpdateReviewRequest ReviewRequest)
        {
            _logger.LogInformation($"PUT Review endpoint hit for ReviewId: {ReviewRequest.ReviewId}");
            try
            {
                var Review = await _service.UpdateReview(ReviewRequest);
                return Ok(Review);
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

        [HttpPut("like-count/{ReviewId}/{LikeChange}")]
        [Authorize]
        public async Task<IActionResult> UpdateLikeCount(string ReviewId, int LikeChange)
        {
            _logger.LogInformation($"PUT Update Like Count endpoint hit for ReviewId: {ReviewId} with LikeChange: {LikeChange}");
            try
            {
                await _service.UpdateReviewLikeCountEfCore7(ReviewId, LikeChange);
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

        [HttpPut("toggle-notifications/{ReviewId}")]
        [Authorize]
        public async Task<IActionResult> ToggleNotifications(string ReviewId)
        {
            _logger.LogInformation($"PUT Toggle Notifications endpoint hit for ReviewId: {ReviewId}");
            try
            {
                await _service.ToggleNotificationsEfCore7(ReviewId);
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

        [HttpPut("report-review/{ReviewId}")]
        public async Task<IActionResult> ReportReview(string ReviewId)
        {
            _logger.LogInformation($"PUT Report Review endpoint hit for ReviewId: {ReviewId}");
            try
            {
                await _service.ReportReviewEfCore7(ReviewId);
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

        [HttpDelete("{ReviewId}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(string ReviewId)
        {
            _logger.LogInformation($"DELETE Review endpoint hit for ReviewId: {ReviewId}");
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
