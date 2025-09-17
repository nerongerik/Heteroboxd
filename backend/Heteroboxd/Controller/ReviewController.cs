using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("reviews")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _service;

        public ReviewController(IReviewService service)
        {
            _service = service;
        }

        //GET endpoints -> limited puiblic access

        [HttpGet]
        public async Task<IActionResult> GetAllReviews()
        {
            //retrives all reviews from database
            try
            {
                var AllReviews = await _service.GetAllReviews();
                return Ok(AllReviews);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("{ReviewId}")]
        public async Task<IActionResult> GetReview(string ReviewId)
        {
            //retrives specific review from database
            try
            {
                var Review = await _service.GetReview(ReviewId);
                return Review == null ? NotFound() : Ok(Review);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("film-reviews/{FilmId}")]
        public async Task<IActionResult> GetReviewsByFilm(string FilmId)
        {
            //retrives all reviews for a specific film from database
            try
            {
                var Reviews = await _service.GetReviewsByFilm(FilmId);
                return Ok(Reviews);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user-reviews/{UserId}")]
        public async Task<IActionResult> GetReviewsByAuthor(string UserId)
        {
            //retrives all reviews by a specific user from database
            try
            {
                var Reviews = await _service.GetReviewsByAuthor(UserId);
                return Ok(Reviews);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //POST endpoints -> public access

        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] CreateReviewRequest ReviewRequest)
        {
            //adds a new review to the database
            try
            {
                await _service.CreateReview(ReviewRequest);
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

        //PUT endpoints -> limited public access (only for their own reviews)

        [HttpPut]
        public async Task<IActionResult> UpdateReview([FromBody] UpdateReviewRequest ReviewRequest)
        {
            //updates an existing review in the database
            try
            {
                await _service.UpdateReview(ReviewRequest);
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

        [HttpPut("like-count/{ReviewId}/{LikeChange}")]
        public async Task<IActionResult> UpdateLikeCount(string ReviewId, string LikeChange)
        {
            //increments/decrements like count for review
            try
            {
                await _service.UpdateReviewLikeCountEfCore7Async(ReviewId, LikeChange);
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
        public async Task<IActionResult> ToggleNotifications(string ReviewId)
        {
            //toggles the notification setting for a review
            try
            {
                await _service.ToggleNotificationsEfCore7Async(ReviewId);
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

        [HttpPut("report-review/{ReviewId")]
        public async Task<IActionResult> ReportReview(string reviewId)
        {
            //increments the flag count for a review
            try
            {
                await _service.ReportReviewEfCore7Async(reviewId);
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

        //DELETE endpoints -> limited public access (only for their own reviews), ADMIN privileges for any review

        [HttpDelete("{ReviewId}")]
        public async Task<IActionResult> DeleteReview(string ReviewId)
        {
            //deletes a review from the database (logical delete)
            try
            {
                await _service.LogicalDeleteReview(ReviewId);
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
