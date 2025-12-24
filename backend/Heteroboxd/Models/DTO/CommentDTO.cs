namespace Heteroboxd.Models.DTO
{
    public class CommentInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorProfilePictureUrl { get; set; }
        public string AuthorTier { get; set; }
        public bool AuthorPatrong { get; set; }
        public string ReviewId { get; set; }

        public CommentInfoResponse(Comment Comment, User Author)
        {
            this.Id = Comment.Id.ToString();
            this.Text = Comment.Text;
            this.Date = Comment.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Comment.Flags;
            this.AuthorId = Comment.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorProfilePictureUrl = Author.PictureUrl;
            this.AuthorTier = Author.Tier.ToString().ToLower();
            this.AuthorPatrong = Author.IsPatron;
            this.ReviewId = Comment.ReviewId.ToString();
        }
    }

    public class PagedCommentResponse
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<CommentInfoResponse> Comments { get; set; }
    }

    public class CreateCommentRequest
    {
        public string Text { get; set; }
        public string AuthorId { get; set; }
        public string ReviewId { get; set; }
    }
}
