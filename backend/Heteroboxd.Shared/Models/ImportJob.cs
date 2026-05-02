using Heteroboxd.Shared.Models.Enums;

namespace Heteroboxd.Shared.Models
{
    public class ImportJob
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public DateTime Date { get; set; }
        public ImportJobStatus Status { get; set; }

        public ImportJob(Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.UserId = UserId;
            this.Date = DateTime.UtcNow;
            this.Status = ImportJobStatus.Pending;
        }
    }
}
