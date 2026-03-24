using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Models.Enums;
using Microsoft.AspNetCore.Identity;

namespace Heteroboxd.Shared.Models
{
    public class User : IdentityUser<Guid>
    {
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public Gender Gender { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public ICollection<User> Followers { get; set; }
        public ICollection<User> Following { get; set; }
        public ICollection<User> Blocked { get; set; }
        public ICollection<Review> LikedReviews { get; set; }
        public ICollection<UserList> LikedLists { get; set; }

        public User()
        {
            PictureUrl = "";
            IsAdmin = false;
            Date = DateTime.UtcNow;
            Flags = 0;
            Followers = new List<User>();
            Following = new List<User>();
            Blocked = new List<User>();
            LikedReviews = new List<Review>();
            LikedLists = new List<UserList>();
        }

        public User(string Name, string Email, string? Bio, string Gender) : this()
        {
            this.UserName = Email;
            this.Email = Email;
            this.Name = Name;
            this.Bio = Bio;
            this.Gender = Gender == "male" ? Enums.Gender.Male : Enums.Gender.Female;
        }

        public void UpdateFields(UpdateUserRequest Request)
        {
            this.Name = string.IsNullOrEmpty(Request.Name) ? this.Name : Request.Name;
            this.Bio = string.IsNullOrEmpty(Request.Bio) ? this.Bio : Request.Bio;
        }
    }
}
