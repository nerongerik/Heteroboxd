using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using System.Threading.Tasks;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _service;

        public NotificationController(INotificationService service) {
            _service = service;
        }

        //GET endpoints -> limited public access

        [HttpGet]
        public async Task<IActionResult> GetAllNotifications()
        {
            //retrives all notifications from database
            try
            {
                var AllNotifs = await _service.GetAllNotifications();
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("{NotificationId}")]
        public async Task<IActionResult> GetNotification(string NotificationId)
        {
            //retrives specific notification from database
            try
            {
                var Notification = await _service.GetNotificationById(NotificationId);
                return Ok(Notification);
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

        [HttpGet("user-notifications/{UserId}")]
        public async Task<IActionResult> GetNotificationsByUser(string UserId)
        {
            //retrives all notifications for a specific user from database
            try
            {
                var Notifications = await _service.GetUsersNotifications(UserId);
                return Ok(Notifications);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //POST endpoints -> public access
        [HttpPost]
        public async Task<IActionResult> AddNotification([FromBody] CreateNotificationRequest NotificationRequest)
        {
            //adds a new notification to the database
            try
            {
                await _service.CreateNotification(NotificationRequest);
                return Ok();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //PUT endpoints -> limited public access
        [HttpPut("{NotificationId}")]
        public async Task<IActionResult> UpdateNotification(string NotificationId)
        {
            //updates notification to read
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

        //DELETE endpoints -> limited public access
        [HttpDelete("{NotificationId}")]
        public async Task<IActionResult> DeleteNotification(string NotificationId)
        {
            //deletes a notification from the database (logical delete)
            try
            {
                await _service.LogicalDeleteNotification(NotificationId);
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
