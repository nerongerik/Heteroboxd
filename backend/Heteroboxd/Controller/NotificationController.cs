using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using System.Threading.Tasks;
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

        [HttpGet("user-notifications/{UserId}")]
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
