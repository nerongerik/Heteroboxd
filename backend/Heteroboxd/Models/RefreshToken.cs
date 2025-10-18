using System.ComponentModel.DataAnnotations;

namespace Heteroboxd.Models
{
    public class RefreshToken
    {
        [Key]
        public Guid Id { get; set; }
        [Required]
        public string Token { get; set; }
        [Required]
        public Guid UserId { get; set; }
        public DateTime Expires { get; set; }
        public bool Used { get; set; }
        public bool Revoked { get; set; }
    }
}
