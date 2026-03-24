using Heteroboxd.Shared.Models.Enums;

namespace Heteroboxd.Shared.Models
{
    public class Notification
    {
        public Guid Id { get; set; }
        public string Text { get; set; }
        public DateTime Date { get; set; }
        public bool Read { get; set; }
        public Guid UserId { get; set; }

        public Notification(string Text, Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Read = false;
            this.UserId = UserId;
        }
    }
}
