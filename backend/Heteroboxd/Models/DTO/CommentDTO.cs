namespace Heteroboxd.Models.DTO
{
    public class CommentInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public bool NotificationsOn { get; set; }
        public string AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorProfilePictureUrl { get; set; }
        public string ReviewId { get; set; }

        public CommentInfoResponse(Comment Comment, User Author)
        {
            this.Id = Comment.Id.ToString();
            this.Text = Comment.Text;
            this.Date = Comment.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Comment.Flags;
            this.NotificationsOn = Comment.NotificationsOn;
            this.AuthorId = Comment.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.ReviewId = Comment.ReviewId.ToString();
        }

        public CommentInfoResponse(Comment Comment)
        {
            this.Id = Comment.Id.ToString();
            this.Text = Comment.Text;
            this.Date = Comment.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Comment.Flags;
            this.NotificationsOn = Comment.NotificationsOn;
            this.AuthorId = Comment.AuthorId.ToString();
            this.ReviewId = Comment.ReviewId.ToString();
        }
    }

    public class CreateCommentRequest
    {
        public string Text { get; set; }
        public int Flags { get; set; }
        public string AuthorId { get; set; }
        public string ReviewId { get; set; }
    }

    public class UpdateCommentRequest
    {
        public string Id { get; set; }
        public string Text { get; set; }
    }
}
