using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class UserList
    {
        [Key]
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string? Description { get; private set; }
        public bool Ranked { get; private set; }
        public DateTime DateCreated { get; private set; }
        public bool NotificationsOn { get; private set; }
        public bool Deleted { get; private set; }
        public ICollection<ListEntry> Films { get; private set; }
        public int LikeCount { get; private set; }
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
