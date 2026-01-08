using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Heteroboxd.Models.DTO
{
    public class NotificationInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public bool Read { get; set; }
        public string UserId { get; set; }

        public NotificationInfoResponse(Notification Notification)
        {
            this.Id = Notification.Id.ToString();
            this.Text = Notification.Text;
            this.Date = Notification.Date.ToString("dd/MM/yyyy HH:mm");
            this.Read = Notification.Read;
            this.UserId = Notification.UserId.ToString();
        }
    }

    public class PagedNotificationResponse
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<NotificationInfoResponse> Notifications { get; set; }
    }
}
