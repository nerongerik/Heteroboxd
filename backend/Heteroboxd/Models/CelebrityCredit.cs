using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class CelebrityCredit
    {
        [Key]
        public Guid Id { get; private set; }
        public Guid CelebrityId { get; private set; }
        public Guid FilmId { get; private set; }
        public Role Role { get; set; }

        public CelebrityCredit(Guid CelebrityId, Guid FilmId, Role Role)
        {
            this.Id = Guid.NewGuid();
            this.CelebrityId = CelebrityId;
            this.FilmId = FilmId;
            this.Role = Role;
        }
    }   
}
