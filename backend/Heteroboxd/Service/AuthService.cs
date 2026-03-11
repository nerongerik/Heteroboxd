using Heteroboxd.Integrations;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Heteroboxd.Service
{
    public interface IAuthService
    {
        Task<List<CountryInfoResponse>> SyncCountries(string? LastSync);
        Task<string?> Register(RegisterRequest Request);
        Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Login(LoginRequest Request);
        Task<bool> Logout(string? RefreshToken, string UserId);
        Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Refresh(string? RefreshToken);
        Task RevokeAllUserTokens(Guid UserId);
        Task ForgotPassword(string Email);
        Task<bool> ResetPassword(ResetPasswordRequest Request);

    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _config;
        private readonly IRefreshTokenRepository _refreshRepo;
        private readonly IR2Handler _r2Handler;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthService> _logger;

        public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config, IRefreshTokenRepository refreshTokenRepo, IR2Handler r2Handler, IEmailSender emailSender, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _refreshRepo = refreshTokenRepo;
            _r2Handler = r2Handler;
            _emailSender = emailSender;
            _logger = logger;
        }

        public async Task<List<CountryInfoResponse>> SyncCountries(string? LastSync)
        {
            var Countries = await _refreshRepo.GetCountriesAsync();
            if (!Countries.Any()) return new List<CountryInfoResponse>();

            if (LastSync != null)
            {
                if (!DateTime.TryParse(LastSync, out DateTime LastSyncDate)) throw new ArgumentException();
                if (Countries.Max(c => c.LastSync) <= LastSyncDate) throw new ArgumentException();
            }

            return Countries
                .Select(c => new CountryInfoResponse { Name = c.Name, Code = c.Code, LastSync = c.LastSync.ToString("dd/MM/yyyy HH:mm") })
                .ToList();
        }

        public async Task<string?> Register(RegisterRequest Request)
        {
            var ExistingUser = await _userManager.FindByEmailAsync(Request.Email);
            if (ExistingUser != null) throw new ArgumentException();

            var User = new User(Request.Name, Request.Email, Request.Bio, Request.Gender);
            User.Watchlist = new Watchlist(User.Id);
            User.Favorites = new UserFavorites(User.Id);

            var Result = await _userManager.CreateAsync(User, Request.Password);
            if (!Result.Succeeded) throw new Exception();

            //generate presigned url (if picture uploaded)
            string? PresignedUrl = null;
            if (!string.IsNullOrEmpty(Request.PictureExtension))
            {
                var (Url, ImgPath) = await _r2Handler.GeneratePresignedUrl(User.Id);

                User.PictureUrl = ImgPath;
                await _userManager.UpdateAsync(User);

                PresignedUrl = Url;
            }


            var Token = await _userManager.GenerateEmailConfirmationTokenAsync(User);
            var ConfirmUrl = $"{_config["Frontend:BaseUrl"]}/verify?userId={User.Id}&token={Uri.EscapeDataString(Token)}";

            //confirmation email
            string Message = $@"
                <html>
                    <body>
                        <p>Welcome Aboard!</p>
                        <p>Please verify your account by clicking <a href=""{ConfirmUrl}"">HERE</a>. (The link is valid for 24 hours)</p>
                    </body>
                </html>";
            await _emailSender.SendEmailAsync(User.Email!, "Verify Your Account", Message);

            return PresignedUrl;
        }

        public async Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Login(LoginRequest Request)
        {
            var User = await _userManager.FindByEmailAsync(Request.Email);
            if (User == null) return (false, null, null);

            var Check = await _signInManager.CheckPasswordSignInAsync(User, Request.Password, false);
            if (!Check.Succeeded) return (false, null, null);

            return (true, GenerateJwt(User), (await GenerateRefreshTokenAsync(User)));
        }

        public async Task<bool> Logout(string? RefreshToken, string UserId)
        {
            if (RefreshToken == null) return false;
            var Token = await _refreshRepo.GetValidTokenAsync(RefreshToken);
            if (Token == null || Token.UserId != Guid.Parse(UserId)) return false;

            Token.Revoked = true;
            await _refreshRepo.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Refresh(string? RefreshToken)
        {
            if (RefreshToken == null) return (false, null, null);

            var Token = await _refreshRepo.GetValidTokenAsync(RefreshToken);
            if (Token == null) return (false, null, null);

            Token.Used = true;

            var User = await _userManager.FindByIdAsync(Token.UserId.ToString());
            if (User == null) return (false, null, null);

            await _refreshRepo.SaveChangesAsync();
            return (true, GenerateJwt(User), await GenerateRefreshTokenAsync(User));
        }

        public async Task RevokeAllUserTokens(Guid UserId) =>
            await _refreshRepo.RevokeAllUserTokens(UserId);

        private string GenerateJwt(User User)
        {
            try
            {
                var Key = Convert.FromBase64String(_config["Jwt:Key"]!);
                var Claims = new List<Claim>
                {
                new Claim(JwtRegisteredClaimNames.Sub, User.Id.ToString()),
                new Claim("name", User.Name!),
                new Claim("pictureUrl", User.PictureUrl!),
                new Claim("admin", User.IsAdmin.ToString()),
                };

                var Creds = new SigningCredentials(new SymmetricSecurityKey(Key), SecurityAlgorithms.HmacSha256);
                var Token = new JwtSecurityToken(
                    issuer: _config["Jwt:Issuer"],
                    audience: _config["Jwt:Audience"],
                    claims: Claims,
                    expires: DateTime.UtcNow.AddHours(3),
                    signingCredentials: Creds
                );

                return new JwtSecurityTokenHandler().WriteToken(Token);
            }
            catch
            {
                throw new Exception();
            }
        }

        private async Task<RefreshToken> GenerateRefreshTokenAsync(User User)
        {
            try
            {
                var Token = new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
                    UserId = User.Id,
                    Expires = DateTime.UtcNow.AddDays(365),
                    Used = false,
                    Revoked = false
                };

                _refreshRepo.Create(Token);
                await _refreshRepo.SaveChangesAsync();

                return Token;
            }
            catch
            {
                throw new Exception();
            }
        }

        public async Task ForgotPassword(string Email)
        {
            var User = await _userManager.FindByEmailAsync(Email);

            //never reveal user's existance
            if (User == null || !(await _userManager.IsEmailConfirmedAsync(User))) return;

            var Token = await _userManager.GeneratePasswordResetTokenAsync(User);

            var ResetUrl = $"{_config["Frontend:BaseUrl"]}/reset-password" + $"?userId={User.Id}&token={Uri.EscapeDataString(Token)}";

            var message = $@"
                <html>
                    <body>
                        <p>You requested a password reset.</p>
                        <p>
                            Click <a href=""{ResetUrl}"">here</a> to reset your password.
                        </p>
                        <p>If you did not request this, you can safely ignore this email.</p>
                    </body>
                </html>";

            await _emailSender.SendEmailAsync(User.Email!, "Reset your password", message);
        }

        public async Task<bool> ResetPassword(ResetPasswordRequest Request)
        {
            var User = await _userManager.FindByIdAsync(Request.UserId);
            if (User == null) return false;

            var Result = await _userManager.ResetPasswordAsync(User, Request.Token, Request.NewPassword);

            if (!Result.Succeeded) return false;

            await _refreshRepo.RevokeAllUserTokens(User.Id);
            return true;
        }
    }
}
