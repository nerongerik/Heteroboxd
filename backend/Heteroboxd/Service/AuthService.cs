using Heteroboxd.Data;
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
        Task Register(RegisterRequest Request);
        Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Login(LoginRequest Request);
        Task<bool> Logout(string RefreshToken, string UserId);
        Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Refresh(string RefreshToken);
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
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthService> _logger;

        public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config, IRefreshTokenRepository refreshTokenRepo, IEmailSender emailSender, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _refreshRepo = refreshTokenRepo;
            _emailSender = emailSender;
            _logger = logger;
        }

        public async Task Register(RegisterRequest Request)
        {
            var ExistingUser = await _userManager.FindByEmailAsync(Request.Email);
            if (ExistingUser != null)
            {
                _logger.LogError($"Failed to register User with Email: {Request.Email}; Already exists.");
                throw new ArgumentException();
            }

            var User = new User(Request.Name, Request.Email, Request.PictureUrl, Request.Bio, Request.Gender);
            User.Watchlist = new Watchlist(User.Id);
            User.Favorites = new UserFavorites(User.Id);

            var Result = await _userManager.CreateAsync(User, Request.Password);
            if (!Result.Succeeded)
            {
                _logger.LogError($"Failed to register User with Email: {Request.Email}; Internal Server Error.");
                throw new Exception();
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
        }

        public async Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Login(LoginRequest Request)
        {
            var User = await _userManager.FindByEmailAsync(Request.Email);
            if (User == null)
            {
                _logger.LogError($"Failed to sign in: User with email {Request.Email} does not exist.");
                return (false, null, null);
            }

            var Check = await _signInManager.CheckPasswordSignInAsync(User, Request.Password, false);
            if (!Check.Succeeded)
            {
                _logger.LogError($"Failed to sign in: password {Request.Password} is invalid.");
                return (false, null, null);
            }

            string Jwt = GenerateJwt(User);
            var RefreshToken = await GenerateRefreshTokenAsync(User);

            _logger.LogInformation("Succesfully generated JWT and Refresh tokens.");
            return (true, Jwt, RefreshToken);
        }

        public async Task<bool> Logout(string RefreshToken, string UserId)
        {
            var Token = await _refreshRepo.GetValidTokenAsync(RefreshToken);
            if (Token == null || Token.UserId != Guid.Parse(UserId)) return false;

            Token.Revoked = true;
            await _refreshRepo.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string? Jwt, RefreshToken? RefreshToken)> Refresh(string RefreshToken)
        {
            var Token = await _refreshRepo.GetValidTokenAsync(RefreshToken);
            if (Token == null)
            {
                _logger.LogError($"Token {RefreshToken} invalid!");
                return (false, null, null);
            }

            Token.Used = true;

            var User = await _userManager.FindByIdAsync(Token.UserId.ToString());
            if (User == null)
            {
                _logger.LogError("User for specified token not found.");
                return (false, null, null);
            }

            var Jwt = GenerateJwt(User);
            var NewRefreshToken = await GenerateRefreshTokenAsync(User);

            await _refreshRepo.SaveChangesAsync();
            return (true, Jwt, NewRefreshToken);
        }

        public async Task RevokeAllUserTokens(Guid UserId)
        {
            var Tokens = await _refreshRepo.GetActiveTokensByUserAsync(UserId);
            foreach (var Token in Tokens) Token.Revoked = true;
            await _refreshRepo.SaveChangesAsync();
        }

        /*
        while the JWT is quite comprehensive, and extremely useful in reducing the amount of backend calls needed
        for the logged in user, the UserInfoResponse DTO will still be fully necessary for displaying the data of OTHER
        users on the platform, as well as the common-changing attributes such as counts
        */
        private string GenerateJwt(User User)
        {
            try
            {
                var Key = Convert.FromBase64String(_config["Jwt:Key"]!);
                var Claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, User.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, User.Email!),
                new Claim("name", User.Name!),
                new Claim("pictureUrl", User.PictureUrl!),
                new Claim("tier", User.Tier.ToString()),
                new Claim("patron", User.IsPatron.ToString()),
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
                _logger.LogError($"Failed to generate Jwt token for user: {User.Id}");
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

                await _refreshRepo.AddAsync(Token);
                await _refreshRepo.SaveChangesAsync();

                return Token;
            }
            catch
            {
                _logger.LogError($"Failed to generate Refresh token for user {User.Id}");
                throw new Exception();
            }
        }

        public async Task ForgotPassword(string Email)
        {
            User? User = await _userManager.FindByEmailAsync(Email);

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
            User? User = await _userManager.FindByIdAsync(Request.UserId);
            if (User == null) return false;

            var Result = await _userManager.ResetPasswordAsync(User, Request.Token, Request.NewPassword);

            if (!Result.Succeeded) return false;

            await RevokeAllUserTokens(User.Id);
            return true;
        }
    }
}
