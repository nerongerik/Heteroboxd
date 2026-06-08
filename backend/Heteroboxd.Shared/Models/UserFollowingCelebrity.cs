namespace Heteroboxd.Shared.Models
{
    public class UserFollowingCelebrity
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public Guid UserId { get; set; }
        public int CelebrityId { get; set; }

        public UserFollowingCelebrity(Guid UserId, int CelebrityId)
        {
            this.Id = Guid.NewGuid();
            this.Date = DateTime.UtcNow;
            this.UserId = UserId;
            this.CelebrityId = CelebrityId;
        }
    }
}
