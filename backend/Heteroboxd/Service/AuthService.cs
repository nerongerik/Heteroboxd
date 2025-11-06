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
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _config;
        private readonly IRefreshTokenRepository _refreshRepo;
        private readonly HeteroboxdContext _context;
        private readonly IEmailSender _emailSender;
        private readonly ILogger<AuthService> _logger;

        public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config, IRefreshTokenRepository refreshTokenRepo, HeteroboxdContext context, IEmailSender emailSender, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _refreshRepo = refreshTokenRepo;
            _context = context;
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

            var User = new User(Request.Name, Request.Email, Request.PictureUrl, Request.Bio);
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
            if (User == null || User.Deleted)
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
            if (User == null || User.Deleted)
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
                new Claim("bio", User.Bio ?? ""),
                new Claim("tier", User.Tier.ToString()),
                new Claim("expiry", User.TierExpiry?.ToString("dd/MM/yyyy HH:mm") ?? ""),
                new Claim("patron", User.IsPatron.ToString()),
                new Claim("joined", User.DateJoined.ToString("dd/MM/yyyy HH:mm"))
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
    }
}
