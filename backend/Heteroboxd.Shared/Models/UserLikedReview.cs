namespace Heteroboxd.Shared.Models
{
    public class UserLikedReview
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public Guid UserId { get; set; }
        public Guid ReviewId { get; set; }

        public UserLikedReview(Guid UserId, Guid ReviewId)
        {
            this.Id = Guid.NewGuid();
            this.Date = DateTime.UtcNow;
            this.UserId = UserId;
            this.ReviewId = ReviewId;
        }
    }
}
