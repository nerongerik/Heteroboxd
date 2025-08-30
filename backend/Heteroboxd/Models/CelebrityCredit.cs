using Heteroboxd.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class CelebrityCredit
    {
        [Key]
        public Guid Id { get; private set; }
        public Film Film { get; private set; }
        public Role Role { get; private set; }

        //public Celebrity Celebrity { get; private set; }

        public CelebrityCredit()
        {
            this.Id = Guid.NewGuid();
            this.Film = new Film();
            this.Role = Role.Actor;
        }
    }
}
