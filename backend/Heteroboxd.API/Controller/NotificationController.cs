using Heteroboxd.API.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Heteroboxd.API.Controller
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

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotificationsByUser(int Page, int PageSize)
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"GetNotificationsByUser endpoint hit for User: {UserId}");
            try
            {
                return Ok(await _service.GetNotificationsByUser(UserId!, Page, PageSize));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("count")]
        [Authorize]
        public async Task<IActionResult> CheckNotifications()
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"CheckNotifications endpoint hit for User: {UserId}");
            try
            {
                return Ok(await _service.AnyNewNotifications(UserId!));
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut("all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var UserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation($"MarkAllAsRead endpoint hit for User: {UserId}");
            try
            {
                await _service.ReadAll(UserId!);
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
            catch
            {
                return StatusCode(500);
            }
        }
    }
}
