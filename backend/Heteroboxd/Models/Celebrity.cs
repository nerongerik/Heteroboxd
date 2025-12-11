using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Heteroboxd.Models
{
    public class Celebrity
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? PictureUrl { get; set; }
        public DateTime? LastSync { get; set; }

        [JsonIgnore]
        public ICollection<CelebrityCredit> Credits { get; set; }

        public Celebrity(int Id, string Name, string? Description, string? PictureUrl)
        {
            this.Id = Id;
            this.Name = Name;
            this.Description = Description;
            this.PictureUrl = PictureUrl;
            this.LastSync = DateTime.UtcNow;
            this.Credits = new List<CelebrityCredit>();
        }
    }
}