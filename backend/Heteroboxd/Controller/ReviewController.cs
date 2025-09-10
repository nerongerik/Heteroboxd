using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("reviews")]
    public class ReviewController
    {
        //GET endpoints -> limited puiblic access

        [HttpGet]
        public IActionResult GetAllReviews()
        {
            //retrives all reviews from database
            //probably useless; consider pagination, sorting, filtering
            return null;
        }

        [HttpGet("{ReviewId}")]
        public IActionResult GetReview(string ReviewId)
        {
            //retrives specific review from database
            return null;
        }

        [HttpGet("film-reviews/{FilmId}")]
        public IActionResult GetReviewsByFilm(string FilmId)
        {
            //retrives all reviews for a specific film from database
            return null;
        }

        [HttpGet("user-reviews/{UserId}")]
        public IActionResult GetReviewsByAuthor(string UserId)
        {
            //retrives all reviews by a specific user from database
            return null;
        }

        //POST endpoints -> public access

        [HttpPost]
        public IActionResult AddReview([FromBody] CreateReviewRequest ReviewRequest)
        {
            //adds a new review to the database
            return null;
        }

        //PUT endpoints -> limited public access (only for their own reviews)

        [HttpPut]
        public IActionResult UpdateReview([FromBody] UpdateReviewRequest ReviewRequest)
        {
            //updates an existing review in the database
            return null;
        }

        [HttpPut("like-count/{ReviewId}/{LikeChange}")]
        public IActionResult UpdateLikeCount(string ReviewId, string LikeChange)
        {
            //LikeChange should be +1 or -1, convert to numeral
            //updates when a user likes/unlikes a review
            return null;
        }

        [HttpPut("toggle-notifications/{ReviewId}")]
        public IActionResult ToggleNotifications(string ReviewId)
        {
            //toggles the notification setting for a review
            return null;
        }

        //DELETE endpoints -> limited public access (only for their own reviews), ADMIN privileges for any review

        [HttpDelete("{ReviewId}")]
        public IActionResult DeleteReview(string ReviewId)
        {
            //deletes a review from the database (logical delete)
            //normal users can only delete their own reviews, admins can delete any review
            return null;
        }
    }
}
