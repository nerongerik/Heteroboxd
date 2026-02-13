namespace Heteroboxd.Models.DTO
{
    public class CountryInfoResponse
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public string LastSync { get; set; }
    }

    public class RegisterRequest()
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string? PictureExtension { get; set; } //null -> default avatar
        public string? Bio { get; set; }
        public string Gender { get; set; }
    }

    public class LoginRequest()
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class RefreshRequest()
    {
        public string Token { get; set; }
    }

    public class LogoutRequest()
    {
        public string Token { get; set; }
        public string UserId { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string UserId { get; set; }
        public string Token { get; set; }
        public string NewPassword { get; set; }
    }
}
