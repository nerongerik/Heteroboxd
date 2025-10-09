namespace Heteroboxd.Models.DTO
{
    public class NotificationInfoResponse
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public bool Read { get; set; }
        public bool Deleted { get; set; }
        public string UserId { get; set; }

        public NotificationInfoResponse(Notification Notification)
        {
            this.Id = Notification.Id.ToString();
            this.Title = Notification.Title;
            this.Text = Notification.Text;
            this.Date = Notification.Date.ToString("dd/MM/yyyy HH:mm");
            this.Read = Notification.Read;
            this.Deleted = Notification.Deleted;
            this.UserId = Notification.UserId.ToString();
        }
    }
    public class CreateNotificationRequest
    {
        public string Title { get; set; }
        public string Text { get; set; }
        public string UserId { get; set; }
    }
}
