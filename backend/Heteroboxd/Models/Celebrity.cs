using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class Celebrity
    {
        [Key]
        public Guid Id { get; private set; }
        public string Name { get; private set; }
        public string? Description { get; private set; }
        public string PictureUrl { get; private set; }
        public bool Deleted { get; private set; }
        public ICollection<CelebrityCredit> Credits { get; private set; }

        public Celebrity()
        {
            this.Id = Guid.NewGuid();
            this.Name = string.Empty;
            this.Description = null;
            this.PictureUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/681px-Placeholder_view_vector.svg.png?20220519031949";
            this.Deleted = false;
            this.Credits = new List<CelebrityCredit>();
        }
    }
}
