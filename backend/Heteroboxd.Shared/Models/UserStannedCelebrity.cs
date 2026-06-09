namespace Heteroboxd.Shared.Models
{
    public class UserStannedCelebrity
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public Guid UserId { get; set; }
        public int CelebrityId { get; set; }

        public UserStannedCelebrity(Guid UserId, int CelebrityId)
        {
            this.Id = Guid.NewGuid();
            this.Date = DateTime.UtcNow;
            this.UserId = UserId;
            this.CelebrityId = CelebrityId;
        }
    }
}
