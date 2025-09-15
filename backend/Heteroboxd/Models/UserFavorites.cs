using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class UserFavorites
    {
        [Key]
        public Guid Id { get; private set; }
        public Film? Film1 { get; private set; }
        public Film? Film2 { get; private set; }
        public Film? Film3 { get; private set; }
        public Film? Film4 { get; private set; }
        public Film? Film5 { get; private set; }
        public Guid UserId { get; private set; }
        public User User { get; private set; }

        public UserFavorites()
        {
            this.Id = Guid.NewGuid();
            this.Film1 = null;
            this.Film2 = null;
            this.Film3 = null;
            this.Film4 = null;
            this.Film5 = null;
            this.User = new User();
            this.UserId = this.User.Id;
        }

        public UserFavorites(User User)
        {
            this.Id = Guid.NewGuid();
            this.Film1 = null;
            this.Film2 = null;
            this.Film3 = null;
            this.Film4 = null;
            this.Film5 = null;
            this.User = User;
            this.UserId = User.Id;
        }
    }
}
