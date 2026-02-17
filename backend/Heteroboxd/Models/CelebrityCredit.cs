using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class CelebrityCredit
    {
        [Key]
        public Guid Id { get; set; }
        public int CelebrityId { get; set; }
        public string CelebrityName { get; set; }
        public string? CelebrityPictureUrl { get; set; }
        public int FilmId { get; set; }
        public Role Role { get; set; }
        public string? Character { get; set; }
        public int? Order { get; set; }

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
