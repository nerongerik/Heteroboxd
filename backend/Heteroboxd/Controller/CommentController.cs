using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/comments")]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _service;
        private readonly ILogger<CommentController> _logger;

        public CommentController(ICommentService service, ILogger<CommentController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("{CommentId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetComment(string CommentId)
        {
            _logger.LogInformation($"GET Comment endpoint hit for {CommentId}");
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
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByReview(string ReviewId)
        {
            _logger.LogInformation($"GET Comments by Review endpoint hit for {ReviewId}");
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

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddComment([FromBody] CreateCommentRequest CommentRequest)
        {
            _logger.LogInformation($"POST Comment endpoint hit for Review: {CommentRequest.ReviewId} by User: {CommentRequest.AuthorId}");
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

        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateComment([FromBody] UpdateCommentRequest CommentRequest)
        {
            _logger.LogInformation($"PUT Comment endpoint hit for {CommentRequest.Id}");
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
        [Authorize]
        public async Task<IActionResult> UpdateLikeCount(string CommentId, string LikeChange)
        {
            //LikeChange is +1 or -1
            _logger.LogInformation($"PUT Update Like Count endpoint hit for {CommentId} with change {LikeChange}");
            try
            {
                await _service.UpdateCommentLikeCountEfCore7(CommentId, LikeChange);
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
        [Authorize]
        public async Task<IActionResult> ToggleNotifications(string CommentId)
        {
            _logger.LogInformation($"PUT Toggle Notifications endpoint hit for {CommentId}");
            try
            {
                await _service.ToggleNotificationsEfCore7(CommentId);
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
        [Authorize]
        public async Task<IActionResult> ReportComment(string CommentId)
        {
            _logger.LogInformation($"PUT Report Comment endpoint hit for {CommentId}");
            try
            {
                await _service.ReportCommentEfCore7(CommentId);
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

        [HttpDelete("{CommentId}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(string CommentId)
        {
            _logger.LogInformation($"DELETE Comment endpoint hit for {CommentId}");
            try
            {
                await _service.DeleteComment(CommentId);
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
