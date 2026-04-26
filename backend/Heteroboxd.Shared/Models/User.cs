using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Models.Enums;
using Microsoft.AspNetCore.Identity;

namespace Heteroboxd.Shared.Models
{
    public class User : IdentityUser<Guid>
    {
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public int PictureUrlCacheVersion { get; set; }
        public string? Bio { get; set; }
        public Gender Gender { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime Date { get; set; }
        public int Flags { get; set; }
        public Guid? PinnedListId { get; set; }
        public Guid? PinnedReviewId { get; set; }

        public User()
        {
            PictureUrl = "";
            PictureUrlCacheVersion = 0;
            IsAdmin = false;
            Date = DateTime.UtcNow;
            Flags = 0;
            PinnedListId = null;
            PinnedReviewId = null;
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
            if (Request.GeneratePresign) this.PictureUrlCacheVersion++;
        }
    }
}
