using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class UserList
    {
        [Key]
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Ranked { get; set; }
        public DateTime DateCreated { get; set; }
        public bool NotificationsOn { get; set; }
        public ICollection<ListEntry> Films { get; set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; set; }

        public UserList(string Name, string? Description, bool Ranked, Guid AuthorId)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Description = Description;
            this.Ranked = Ranked;
            this.DateCreated = DateTime.UtcNow;
            this.NotificationsOn = true;
            this.Films = new List<ListEntry>();
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
        }
    }
}
