using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Notification
    {
        [Key]
        public Guid Id { get; private set; }
        public string Title { get; private set; }
        public string Text { get; private set; }
        public DateTime Date { get; private set; }
        public bool Read { get; private set; }
        public bool Deleted { get; private set; }
        public Guid UserId { get; private set; }

        public Notification(string Title, string Text, Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.Title = Title;
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.Read = false;
            this.Deleted = false;
            this.UserId = UserId;
        }
    }
}
