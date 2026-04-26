namespace Heteroboxd.Shared.Models
{
    public class UserLikedList
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public Guid UserId { get; set; }
        public Guid ListId { get; set; }

        public UserLikedList(Guid UserId, Guid ListId)
        {
            this.Id = Guid.NewGuid();
            this.Date = DateTime.UtcNow;
            this.UserId = UserId;
            this.ListId = ListId;
        }
    }
}
