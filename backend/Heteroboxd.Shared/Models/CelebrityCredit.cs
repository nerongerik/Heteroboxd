using Heteroboxd.Shared.Models.Enums;

namespace Heteroboxd.Shared.Models
{
    public class CelebrityCredit
    {
        public Guid Id { get; set; }
        public Role Role { get; set; }
        public string? Character { get; set; }
        public int? Order { get; set; }
        public int CelebrityId { get; set; }
        public int FilmId { get; set; }

        public CelebrityCredit(int CelebrityId, int FilmId, Role Role, string? Character, int? Order)
        {
            this.Id = Guid.NewGuid();
            this.CelebrityId = CelebrityId;
            this.FilmId = FilmId;
            this.Role = Role;
            this.Character = Character;
            this.Order = Order;
        }
    }   
}
