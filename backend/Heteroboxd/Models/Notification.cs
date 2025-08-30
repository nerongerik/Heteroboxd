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
        public User User { get; private set; }

        public Notification()
        {
            this.Id = Guid.NewGuid();
            this.Title = string.Empty;
            this.Text = string.Empty;
            this.Date = DateTime.UtcNow;
            this.Read = false;
            this.Deleted = false;
            this.User = new User();
        }
    }
}
