using Heteroboxd.Shared.Integrations;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Repository;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace Heteroboxd.API.Service
{
    public interface IAuthService
    {
        Task<List<CountryInfoResponse>> SyncCountries(string? LastSync);
        Task<string?> Register(RegisterRequest Request);
        Task<(bool Success, bool EmailUnverified, string? Jwt, RefreshToken? RefreshToken)> Login(LoginRequest Request);
        (bool Success, string? AdminToken) VerifyAdminKey(string Key);
        Task Logout(string? RefreshToken, string UserId);
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
        private readonly IAuthRepository _authRepo;
        private readonly IR2Handler _r2Handler;
        private readonly IEmailSender _emailSender;

        public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config, IAuthRepository authRepo, IR2Handler r2Handler, IEmailSender emailSender)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _authRepo = authRepo;
            _r2Handler = r2Handler;
            _emailSender = emailSender;
        }

        public async Task<List<CountryInfoResponse>> SyncCountries(string? LastSync)
        {
            var Countries = await _authRepo.GetCountriesAsync();
            if (Countries.Count == 0) return new List<CountryInfoResponse>();

            if (LastSync != null)
            {
                if (!DateTime.TryParse(LastSync, out DateTime LastSyncDate)) throw new ArgumentException();
                if (Countries.Max(c => c.LastSync) <= LastSyncDate) throw new ArgumentException();
            }

            return Countries
                .Select(c => new CountryInfoResponse { Name = c.Name, Code = c.Code, LastSync = c.LastSync.ToString("yyyy-MM-dd HH:mm") })
                .ToList();
        }

        public async Task<string?> Register(RegisterRequest Request)
        {
            var ExistingUser = await _userManager.FindByEmailAsync(Request.Email);
            if (ExistingUser != null) throw new ArgumentException();

            var User = new User(Regex.Replace(Request.Name.Trim(), @"\s+", " "), Request.Email, Request.Bio, Request.Gender);

            var Result = await _userManager.CreateAsync(User, Request.Password);
            if (!Result.Succeeded) throw new Exception();

            await _authRepo.InitFavoritesAsync(new UserFavorites(User.Id));

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

        public async Task<(bool Success, bool EmailUnverified, string? Jwt, RefreshToken? RefreshToken)> Login(LoginRequest Request)
        {
            var User = await _userManager.FindByEmailAsync(Request.Email);
            if (User == null) return (false, false, null, null);

            var Check = await _signInManager.CheckPasswordSignInAsync(User, Request.Password, false);

            if (Check.IsNotAllowed) return (false, true, null, null);
            if (!Check.Succeeded) return (false, false, null, null);

            return (true, false, GenerateJwt(User), (await GenerateRefreshTokenAsync(User)));
        }

        public (bool Success, string? AdminToken) VerifyAdminKey(string Key)
        {
            if (Key != _config["Admin:Key"]) return (false, null);

            var AdminToken = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: new[] { new Claim("admin_session", "true") },
                expires: DateTime.UtcNow.AddMinutes(30),
                signingCredentials: new SigningCredentials(
                    new SymmetricSecurityKey(Convert.FromBase64String(_config["Jwt:Key"]!)),
                    SecurityAlgorithms.HmacSha256)
            );
            return (true, new JwtSecurityTokenHandler().WriteToken(AdminToken));
        }

        public async Task Logout(string? RefreshToken, string UserId) =>
            await _authRepo.InvalidateAsync(Guid.Parse(UserId), RefreshToken ?? "");

        public async Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Refresh(string? RefreshToken)
        {
            var UserId = await _authRepo.UseAsync(RefreshToken ?? "");
            if (UserId == null) return (false, null, null);

            var User = await _userManager.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == UserId);
            if (User == null) return (false, null, null);

            return (true, GenerateJwt(User), await GenerateRefreshTokenAsync(User));
        }

        public async Task RevokeAllUserTokens(Guid UserId) =>
            await _authRepo.RevokeAllByUserAsync(UserId);

        private string GenerateJwt(User User)
        {
            try
            {
                var Key = Convert.FromBase64String(_config["Jwt:Key"]!);
                var Claims = new List<Claim>
                {
                new Claim(JwtRegisteredClaimNames.Sub, User.Id.ToString()),
                new Claim("name", User.Name!),
                new Claim("pictureUrl", string.IsNullOrEmpty(User.PictureUrl) ? User.PictureUrl : User.PictureUrl + $"?v={User.PictureUrlCacheVersion}"),
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

                await _authRepo.CreateAsync(Token);

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

            await _authRepo.RevokeAllByUserAsync(User.Id);
            return true;
        }
    }
}
