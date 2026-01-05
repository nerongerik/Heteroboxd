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
        public async Task<IActionResult> GetNotificationsByUser(string UserId)
        {
            _logger.LogInformation($"GET Notifications by User endpoint hit for User: {UserId}");
            try
            {
                var Notifications = await _service.GetNotificationsByUser(UserId);
                return Ok(Notifications);
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
            _logger.LogInformation($"GET number of new notifications endpoint hit for User: {UserId}");
            try
            {
                var Count = await _service.AnyNewNotifications(UserId);
                return Ok(Count);
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
            _logger.LogInformation($"PUT all notifs as read endpoint hit for User: {UserId}");
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
            _logger.LogInformation($"PUT Update Notification endpoint hit for Notification: {NotificationId}");
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
            _logger.LogInformation($"DELETE Notification endpoint hit for Notification: {NotificationId}");
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
