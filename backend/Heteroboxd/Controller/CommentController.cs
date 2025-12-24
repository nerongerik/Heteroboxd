using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        [HttpGet("review/{ReviewId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByReview(string ReviewId, int Page = 1, int PageSize = 20)
        {
            _logger.LogInformation($"GET Comments by Review endpoint hit for {ReviewId}");
            try
            {
                var ReviewComments = await _service.GetCommentsByReview(ReviewId, Page, PageSize);
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
