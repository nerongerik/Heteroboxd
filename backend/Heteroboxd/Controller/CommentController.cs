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

        [HttpGet("review")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByReview(string ReviewId, int Page = 1, int PageSize = 96)
        {
            _logger.LogInformation($"GetCommentsByReview endpoint hit for {ReviewId}");
            try
            {
                return Ok(await _service.GetCommentsByReview(ReviewId, Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddComment(CreateCommentRequest CommentRequest)
        {
            _logger.LogInformation($"AddComment endpoint hit for Review: {CommentRequest.ReviewId} by User: {CommentRequest.AuthorId}");
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

        [HttpPut("{CommentId}")]
        [Authorize]
        public async Task<IActionResult> ReportComment(string CommentId)
        {
            _logger.LogInformation($"ReportComment endpoint hit for {CommentId}");
            try
            {
                await _service.ReportCommentEfCore7(CommentId);
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

        [HttpDelete("{CommentId}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(string CommentId)
        {
            _logger.LogInformation($"DeleteComment endpoint hit for {CommentId}");
            try
            {
                await _service.DeleteComment(CommentId);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
