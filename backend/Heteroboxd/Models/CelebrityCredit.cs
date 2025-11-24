using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class CelebrityCredit
    {
        [Key]
        public Guid Id { get; set; }
        public int CelebrityId { get; set; }
        public string CelebrityName { get; set; } //easier display without extra joins
        public string? CelebrityPictureUrl { get; set; } //easier display without extra joins
        public int FilmId { get; set; }
        public Role Role { get; set; }
        public string? Character { get; set; } //for actors only
        public int? Order { get; set; } //for ordering cast list

        public CelebrityCredit(int CelebrityId, string CelebrityName, string? CelebrityPictureUrl, int FilmId, Role Role, string? Character, int? Order)
        {
            this.Id = Guid.NewGuid();
            this.CelebrityId = CelebrityId;
            this.CelebrityName = CelebrityName;
            this.CelebrityPictureUrl = CelebrityPictureUrl;
            this.FilmId = FilmId;
            this.Role = Role;
            this.Character = Character;
            this.Order = Order;
        }
    }   
}
