namespace Heteroboxd.Models
{
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public string Token { get; set; }
        public Guid UserId { get; set; }
        public DateTime Expires { get; set; }
        public bool Used { get; set; }
        public bool Revoked { get; set; }
    }
}
