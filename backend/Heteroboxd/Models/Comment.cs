using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Comment
    {
        [Key]
        public Guid Id { get; set; }
        public string Text { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public Guid AuthorId { get; set; }
        public Guid ReviewId { get; set; }

        public Comment(string Text, Guid AuthorId, Guid ReviewId)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Date = DateTime.UtcNow;
            this.AuthorId = AuthorId;
            this.ReviewId = ReviewId;
        }
    }
}
