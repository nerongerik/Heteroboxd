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
}
