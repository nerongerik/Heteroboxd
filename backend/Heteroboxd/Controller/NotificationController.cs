using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _service;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(INotificationService service, ILogger<NotificationController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("{UserId}")]
        [Authorize]
        public async Task<IActionResult> GetNotificationsByUser(string UserId, int Page, int PageSize)
        {
            _logger.LogInformation($"GetNotificationsByUser endpoint hit for User: {UserId}");
            try
            {
                var Response = await _service.GetNotificationsByUser(UserId, Page, PageSize);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("count/{UserId}")]
        [Authorize]
        public async Task<IActionResult> CheckNotifications(string UserId)
        {
            _logger.LogInformation($"CheckNotifications endpoint hit for User: {UserId}");
            try
            {
                var Response = await _service.AnyNewNotifications(UserId);
                return Ok(Response);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut("all/{UserId}")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead(string UserId)
        {
            _logger.LogInformation($"MarkAllAsRead endpoint hit for User: {UserId}");
            try
            {
                await _service.ReadAll(UserId);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut("{NotificationId}")]
        [Authorize]
        public async Task<IActionResult> UpdateNotification(string NotificationId)
        {
            _logger.LogInformation($"UpdateNotification endpoint hit for Notification: {NotificationId}");
            try
            {
                await _service.UpdateNotification(NotificationId);
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

        [HttpDelete("{NotificationId}")]
        [Authorize]
        public async Task<IActionResult> DeleteNotification(string NotificationId)
        {
            _logger.LogInformation($"DeleteNotification endpoint hit for Notification: {NotificationId}");
            try
            {
                await _service.DeleteNotification(NotificationId);
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
