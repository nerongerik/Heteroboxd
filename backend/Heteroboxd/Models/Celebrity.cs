using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Celebrity
    {
        [Key]
        public Guid Id { get; private set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string PictureUrl { get; set; }
        public DateTime? LastSync { get; set; }
        public bool NameLocked { get; set; } //if true, name won't be updated during sync
        public bool DescriptionLocked { get; set; } //if true, description won't be updated during sync
        public bool PictureUrlLocked { get; set; } //if true, picture url won't be updated during sync
        public bool Deleted { get; set; }
        public ICollection<CelebrityCredit> Credits { get; set; }

        public Celebrity(string Name, string? Description, string? PictureUrl)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Description = Description;
            this.PictureUrl = PictureUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.LastSync = DateTime.UtcNow;
            this.NameLocked = false;
            this.DescriptionLocked = false;
            this.PictureUrlLocked = false;
            this.Deleted = false;
            this.Credits = new List<CelebrityCredit>();
        }
    }
}
