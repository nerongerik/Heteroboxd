namespace Heteroboxd.Shared.Models
{
    public class Comment
    {
        public Guid Id { get; set; }
        public string Text { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public Guid? AuthorId { get; set; }
        public Guid ReviewId { get; set; }
        public Guid? RepliedCommentId { get; set; }
        public Guid? RepliedUserId { get; set; }
        public Guid? ThreadRootId { get; set; }
        public Enums.Tombstone? Tombstone { get; set; }

        private Comment()
        {
            this.Text = string.Empty;
        }

        public Comment(string Text, Guid AuthorId, Guid ReviewId, Guid? RepliedCommentId = null, Guid? RepliedUserId = null, Guid? ThreadRootId = null)
        {
            this.Id = Guid.NewGuid();
            this.Text = Text;
            this.Flags = 0;
            this.Date = DateTime.UtcNow;
            this.AuthorId = AuthorId;
            this.ReviewId = ReviewId;
            this.RepliedCommentId = RepliedCommentId;
            this.RepliedUserId = RepliedUserId;
            this.ThreadRootId = ThreadRootId;
            this.Tombstone = null;
        }
    }
}
