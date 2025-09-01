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
        public bool NotificationsOn { get; private set; }
        public bool Deleted { get; private set; }
        public User Author { get; private set; }
        public ICollection<ListEntry> Films { get; private set; }
        public int LikeCount { get; private set; }

        public UserList()
        {
            this.Id = Guid.NewGuid();
            this.Name = string.Empty;
            this.Description = null;
            this.Ranked = false;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Author = new User();
            this.Films = new List<ListEntry>();
            this.LikeCount = 0;
        }

        public UserList(string Name, string? Description, bool Ranked, User Author)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Description = Description;
            this.Ranked = Ranked;
            this.NotificationsOn = true;
            this.Deleted = false;
            this.Author = Author;
            this.Films = new List<ListEntry>();
            this.LikeCount = 0;
        }
    }
}
