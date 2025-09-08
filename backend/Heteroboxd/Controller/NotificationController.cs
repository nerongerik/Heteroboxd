using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("notifications")]
    public class NotificationController
    {
        //GET endpoints -> limited public access

        [HttpGet]
        public IActionResult GetAllNotifications()
        {
            //retrives all notifications from database
            //probably useless; consider pagination, sorting, filtering
            return null;
        }

        [HttpGet("{NotificationId}")]
        public IActionResult GetNotification(string NotificationId)
        {
            //retrives specific notification from database
            return null;
        }

        [HttpGet("user-notifications/{UserId}")]
        public IActionResult GetNotificationsByUser(string UserId)
        {
            //retrives all notifications for a specific user from database
            return null;
        }

        //POST endpoints -> public access
        [HttpPost]
        public IActionResult AddNotification([FromBody] CreateNotificationRequest NotificationRequest)
        {
            //adds a new notification to the database
            //probably only internal use, keep anyway
            return null;
        }

        //PUT endpoints -> limited public access
        [HttpPut]
        public IActionResult UpdateNotification([FromBody] UpdateNotificationRequest NotificationRequest)
        {
            //updates an existing notification in the database
            //used to mark as read/unread
            return null;
        }

        //DELETE endpoints -> limited public access
        [HttpDelete("{NotificationId}")]
        public IActionResult DeleteNotification(string NotificationId)
        {
            //deletes a notification from the database (logical delete)
            return null;
        }
    }
}
