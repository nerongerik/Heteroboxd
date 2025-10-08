using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class UserList
    {
        [Key]
        public Guid Id { get; private set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Ranked { get; set; }
        public DateTime DateCreated { get; private set; }
        public bool NotificationsOn { get; set; }
        public bool Deleted { get; set; }
        public ICollection<ListEntry> Films { get; set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; private set; }

        public UserList(string Name, string? Description, bool Ranked, Guid AuthorId)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Description = Description;
            this.Ranked = Ranked;
            this.DateCreated = DateTime.Now;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Films = new List<ListEntry>();
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
        }
    }
}
