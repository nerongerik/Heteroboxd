using Heteroboxd.Models.DTO;
using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class UserFavorites
    {
        [Key]
        public Guid Id { get; set; }
        public int? Film1 { get; set; }
        public int? Film2 { get; set; }
        public int? Film3 { get; set; }
        public int? Film4 { get; set; }
        public Guid UserId { get; set; }

        public UserFavorites(Guid UserId)
        {
            this.Id = Guid.NewGuid();
            this.UserId = UserId;
        }
    }
}
