using Heteroboxd.Models.DTO;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class UserFavorites
    {
        [Key]
        public Guid Id { get; private set; }
        public Guid? Film1 { get; set; }
        public Guid? Film2 { get; set; }
        public Guid? Film3 { get; set; }
        public Guid? Film4 { get; set; }
        public Guid UserId { get; private set; }

        public UserFavorites(Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.UserId = UserId;
        }
    }
}
