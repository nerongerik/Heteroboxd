using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Notification
    {
        [Key]
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Text { get; set; }
        public DateTime Date { get; set; }
        public bool Read { get; set; }
        public Guid UserId { get; set; }

        public Notification(string Title, string Text, Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Title = Title;
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Read = false;
            this.UserId = UserId;
        }
    }
}
