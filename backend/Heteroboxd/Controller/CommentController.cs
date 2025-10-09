using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using System.Threading.Tasks;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/comments")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _service;

        public CommentController(ICommentService service)
        {
            _service = service;
        }

        //GET endpoints -> limited public access

        [HttpGet]
        public async Task<IActionResult> GetComments()
        {
            //retrieves all comments from database
            try
            {
                var AllComments = await _service.GetAllComments();
                return Ok(AllComments);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("{CommentId}")]
        public async Task<IActionResult> GetCommentById(string CommentId)
        {
            //retrieves specific comment from database
            try
            {
                var Comment = await _service.GetComment(CommentId);
                return Ok(Comment);
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

        [HttpGet("review-comments/{ReviewId}")]
        public async Task<IActionResult> GetCommentsByReview(string ReviewId)
        {
            //retrieves all comments for given review from database
            try
            {
                var ReviewComments = await _service.GetCommentsByReview(ReviewId);
                return Ok(ReviewComments);
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

        [HttpGet("user-comments/{UserId}")]
        public async Task<IActionResult> GetCommentsByAuthor(string UserId)
        {
            //retrieves all comments by given user from database
            try
            {
                var UserComments = await _service.GetCommentsByAuthor(UserId);
                return Ok(UserComments);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //POST endpoints -> public access

        [HttpPost]
        public async Task<IActionResult> AddComment([FromBody] CreateCommentRequest CommentRequest)
        {
            //adds a new comment to the database
            try
            {
                await _service.CreateComment(CommentRequest);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //PUT endpoints -> limited public access (only for their own comments)

        [HttpPut]
        public async Task<IActionResult> UpdateComment([FromBody] UpdateCommentRequest CommentRequest)
        {
            //updates an existing comment in the database
            try
            {
                await _service.UpdateComment(CommentRequest);
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

        [HttpPut("like-count/{CommentId}/{LikeChange}")]
        public async Task<IActionResult> UpdateLikeCount(string CommentId, string LikeChange)
        {
            //LikeChange should be +1 or -1, convert to numeral
            //updates when a user likes/unlikes a comment
            try
            {
                await _service.UpdateCommentLikeCountEfCore7Async(CommentId, LikeChange);
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

        [HttpPut("toggle-notifications/{CommentId}")]
        public async Task<IActionResult> ToggleNotifications(string CommentId)
        {
            //toggles the notification setting for a comment
            try
            {
                await _service.ToggleNotificationsEfCore7Async(CommentId);
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

        [HttpPut("report/{CommentId}")]
        public async Task<IActionResult> ReportComment(string CommentId)
        {
            //flags a comment as reported for admin review
            try
            {
                await _service.ReportCommentEfCore7Async(CommentId);
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

        //DELETE endpoints -> limited public access (only for their own comments), ADMIN privileges for any comment

        [HttpDelete("{CommentId}")]
        public async Task<IActionResult> DeleteComment(string CommentId)
        {
            //deletes a comment from the database
            //normal users can only delete their own reviews, admins can delete any review
            try
            {
                await _service.LogicalDeleteComment(CommentId);
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
