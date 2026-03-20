using Heteroboxd.Models.DTO;

namespace Heteroboxd.Models
{
    public class UserList
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Ranked { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public bool NotificationsOn { get; set; }
        public int Size { get; set; }
        public int LikeCount { get; set; }
        public Guid AuthorId { get; set; }

        public UserList(string Name, string? Description, bool Ranked, int Size, Guid AuthorId)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Description = Description;
            this.Ranked = Ranked;
            this.Date = DateTime.UtcNow;
            this.Flags = 0;
            this.NotificationsOn = true;
            this.Size = Size;
            this.LikeCount = 0;
            this.AuthorId = AuthorId;
        }

        public void UpdateFields(UpdateUserListRequest Request, int Count)
        {
            this.Name = string.IsNullOrEmpty(Request.Name) ? this.Name : Request.Name;
            this.Description = string.IsNullOrEmpty(Request.Description) ? this.Description : Request.Description;
            this.Ranked = Request.Ranked;
            this.Date = DateTime.UtcNow;
            this.Size = Count;
        }
    }
}
