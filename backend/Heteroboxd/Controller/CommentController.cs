using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("comments")]
    public class CommentController
    {
        //GET endpoints -> limited public access
        [HttpGet]
        public IActionResult GetComments()
        {
            //retrieves all comments from database
            return null;
        }

        [HttpGet("{CommentId}")]
        public IActionResult GetCommentById(string CommentId)
        {
            //retrieves specific comment from database
            return null;
        }

        [HttpGet("review-comments/{ReviewId}")]
        public IActionResult GetCommentsByReview(string ReviewId)
        {
            //retrieves all comments for given review from database
            return null;
        }

        [HttpGet("user-comments/{UserId}")]
        public IActionResult GetCommentsByAuthor(string UserId)
        {
            //retrieves all comments by given user from database
            return null;
        }

        //POST endpoints -> public access

        [HttpPost]
        public IActionResult AddComment([FromBody] CreateCommentRequest CommentRequest)
        {
            //adds a new comment to the database
            //CreateCommentRequest must contain the targeted ReviewId
            return null;
        }

        //PUT endpoints -> limited public access (only for their own comments)

        [HttpPut]
        public IActionResult UpdateComment([FromBody] UpdateCommentRequest CommentRequest)
        {
            //updates an existing comment in the database
            return null;
        }

        [HttpPut("like-count/{CommentId}/{LikeChange}")]
        public IActionResult UpdateLikeCount(string CommentId, string LikeChange)
        {
            //LikeChange should be +1 or -1, convert to numeral
            //updates when a user likes/unlikes a comment
            return null;
        }

        [HttpPut("toggle-notifications/{CommentId}")]
        public IActionResult ToggleNotifications(string CommentId)
        {
            //toggles the notification setting for a comment
            return null;
        }

        //DELETE endpoints -> limited public access (only for their own comments), ADMIN privileges for any comment

        [HttpDelete("{CommentId}")]
        public IActionResult DeleteComment(string CommentId)
        {
            //deletes a comment from the database
            //normal users can only delete their own reviews, admins can delete any review
            return null;
        }
    }
}
