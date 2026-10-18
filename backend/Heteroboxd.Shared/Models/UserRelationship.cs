namespace Heteroboxd.Shared.Models
{
    public class UserRelationship
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public Guid UserId { get; set; }
        public Guid TargetId { get; set; }
        public bool NotificationsOn { get; set; }
        public UserRelationship(Guid UserId, Guid TargetId, bool NotificationsOn = true)
        {
            this.Id = Guid.NewGuid();
            this.Date = DateTime.UtcNow;
            this.UserId = UserId;
            this.TargetId = TargetId;
            this.NotificationsOn = NotificationsOn;
        }
    }
}
