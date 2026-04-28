using Heteroboxd.Shared.Models.Enums;

namespace Heteroboxd.Shared.Models
{
    public class ImportJob
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Key { get; set; }
        public DateTime Date { get; set; }
        public ImportJobStatus Status { get; set; }

        public ImportJob(Guid UserId, string Key)
        {
            this.Id = Guid.NewGuid();
            this.UserId = UserId;
            this.Key = Key;
            this.Date = DateTime.UtcNow;
            this.Status = ImportJobStatus.Pending;
        }
    }
}
