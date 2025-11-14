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
        public bool Deleted { get; set; }
        public int TmdbId { get; set; }
        public ICollection<CelebrityCredit> Credits { get; set; }

        public Celebrity(string Name, string? Description, string? PictureUrl, int TmdbId)
        {
            this.Id = Guid.NewGuid();
            this.Name = Name;
            this.Description = Description;
            this.PictureUrl = PictureUrl ?? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.LastSync = DateTime.UtcNow;
            this.Deleted = false;
            this.Credits = [];
            this.TmdbId = TmdbId;
        }
    }
}
