namespace Heteroboxd.Models.DTO
{
    public class RegisterRequest()
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string? PictureUrl { get; set; }
        public string? Bio { get; set; }
    }

    public class LoginRequest()
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
