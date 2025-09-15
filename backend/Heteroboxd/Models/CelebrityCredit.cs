using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class CelebrityCredit
    {
        [Key]
        public Guid Id { get; private set; }
        public Guid CelebrityId { get; private set; }
        public Celebrity Celebrity { get; private set; }
        public Guid FilmId { get; private set; }
        public Film Film { get; private set; }
        public Role Role { get; private set; }

        public CelebrityCredit()
        {
            this.Id = Guid.NewGuid();
            this.Celebrity = new Celebrity();
            this.CelebrityId = this.Celebrity.Id;
            this.Film = new Film();
            this.FilmId = this.Film.Id;
            this.Role = Role.Actor;
        }

        public CelebrityCredit(Celebrity Celebrity, Film Film, Role Role)
        {
            this.Id = Guid.NewGuid();
            this.Celebrity = Celebrity;
            this.CelebrityId = Celebrity.Id;
            this.Film = Film;
            this.FilmId = Film.Id;
            this.Role = Role;
        }
    }   
}
