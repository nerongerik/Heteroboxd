using Heteroboxd.Models.Enums;

namespace Heteroboxd.Models
{
    public class Report //represents a user reporting another user, not regular review/comment flagging that remains simple
    {
        public Guid Id { get; private set; }
        public Reason Reason { get; private set; }
        public string? Description { get; private set; }
        public Guid TargetId { get; private set; }
        public User Target { get; private set; } //the user being reported, reporter anonymous
        public DateTime Date { get; private set; }
        public bool Deleted { get; set; }

        public Report()
        {
            this.Id = Guid.NewGuid();
            this.Reason = Reason.Blasphemy;
            this.Description = null;
            this.Target = new User();
            this.TargetId = this.Target.Id;
            this.Date = DateTime.UtcNow;
            this.Deleted = false;
        }
        public Report(Reason Reason, string? Description, User Target)
        {
            this.Id = Guid.NewGuid();
            this.Reason = Reason;
            this.Description = Description;
            this.Target = Target;
            this.TargetId = Target.Id;
            this.Date = DateTime.UtcNow;
            this.Deleted = false;
        }
    }
}
