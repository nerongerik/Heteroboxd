using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Notification
    {
        [Key]
        public Guid Id { get; set; }
        public string Text { get; set; }
        public NotificationType Type { get; set; }
        public DateTime Date { get; set; }
        public bool Read { get; set; }
        public Guid UserId { get; set; }

        public Notification(string Text, NotificationType Type, Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Type = Type;
            this.Date = DateTime.UtcNow;
            this.Read = false;
            this.UserId = UserId;
        }
    }
}
