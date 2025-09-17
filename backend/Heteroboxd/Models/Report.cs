using Heteroboxd.Models.Enums;

namespace Heteroboxd.Models
{
    //represents a user reporting another user, not regular review/comment flagging that remains simple
    public class Report
    {
        public Guid Id { get; private set; }
        public Reason Reason { get; private set; }
        public string? Description { get; private set; }
        public DateTime Date { get; private set; }
        public bool Deleted { get; set; }
        public Guid TargetId { get; private set; } //the user being reported, reporter anonymous

        public Report(Reason Reason, string? Description, Guid TargetId)
        {
            this.Id = Guid.NewGuid();
            this.Reason = Reason;
            this.Description = Description;
            this.Date = DateTime.UtcNow;
            this.Deleted = false;
            this.TargetId = TargetId;
        }
    }
}
