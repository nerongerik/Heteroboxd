using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Transactions;

namespace Heteroboxd.Service
{
    public interface IAuthService
    {
        Task Register(RegisterRequest Request);
        Task<(bool Success, string? Jwt, string? RefreshToken, UserInfoResponse? User)> Login(LoginRequest Request);
        Task<bool> Logout(string RefreshToken, Guid UserId);
        Task<(bool Success, string? Jwt, string? RefreshToken)> Refresh(string RefreshToken);
        Task RevokeAllUserTokens(Guid UserId);
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _config;
        private readonly IRefreshTokenRepository _refreshRepo;
        private readonly IEmailService _emailService;

        public AuthService(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config, IRefreshTokenRepository refreshTokenRepo, IEmailService emailService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
            _refreshRepo = refreshTokenRepo;
            _emailService = emailService;
        }

        public async Task Register(RegisterRequest Request)
        {
            var ExistingUser = await _userManager.FindByEmailAsync(Request.Email);
            if (ExistingUser != null) throw new ArgumentException();

            using var _scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

            var User = new User(Request.Name, Request.Email, Request.PictureUrl, Request.Bio);
            User.Watchlist = new Watchlist(User.Id);
            User.Favorites = new UserFavorites(User.Id);

            var Result = await _userManager.CreateAsync(User, Request.Password);
            if (!Result.Succeeded) throw new ArgumentException();

            var Token = await _userManager.GenerateEmailConfirmationTokenAsync(User);
            var ConfirmUrl = $"{_config["Frontend:BaseUrl"]}/verify?userId={User.Id}&token={Uri.EscapeDataString(Token)}";

            _scope.Complete();

            //if the SMTP server poops itself, we still have a user and his verification in the DB, plus we retry 3 times

            const int MaxRetries = 3;
            const int DelayMs = 2000;
            int Attempt = 0;
            bool EmailSent = false;

            while (!EmailSent && Attempt < MaxRetries)
            {
                try
                {
                    Attempt++;
                    await _emailService.SendVerification(User.Email, ConfirmUrl);
                    EmailSent = true;
                }
                catch
                {
                    if (Attempt < MaxRetries) await Task.Delay(DelayMs);
                    //else, give up :(
                }
            }
        }

        public async Task<(bool Success, string? Jwt, string? RefreshToken, UserInfoResponse? User)> Login(LoginRequest Request)
        {
            var User = await _userManager.FindByEmailAsync(Request.Email);
            if (User == null || User.Deleted) return (false, null, null, null);

            var Check = await _signInManager.CheckPasswordSignInAsync(User, Request.Password, false);
            if (!Check.Succeeded) return (false, null, null, null);

            var Jwt = await GenerateJwtAsync(User);
            var RefreshToken = await GenerateRefreshTokenAsync(User);

            return (true, Jwt, RefreshToken.Token, new UserInfoResponse(User));
        }

        public async Task<bool> Logout(string RefreshToken, Guid UserId)
        {
            var Token = await _refreshRepo.GetValidTokenAsync(RefreshToken);
            if (Token == null || Token.UserId != UserId) return false;

            Token.Revoked = true;
            await _refreshRepo.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string? Jwt, string? RefreshToken)> Refresh(string RefreshToken)
        {
            var Token = await _refreshRepo.GetValidTokenAsync(RefreshToken);
            if (Token == null) return (false, null, null);

            Token.Used = true;

            var User = await _userManager.FindByIdAsync(Token.UserId.ToString());
            if (User == null || User.Deleted) return (false, null, null);

            var Jwt = await GenerateJwtAsync(User);
            var NewRefreshToken = await GenerateRefreshTokenAsync(User);

            await _refreshRepo.SaveChangesAsync();

            return (true, Jwt, NewRefreshToken.Token);
        }

        public async Task RevokeAllUserTokens(Guid UserId)
        {
            var Tokens = await _refreshRepo.GetActiveTokensByUserAsync(UserId);
            foreach (var Token in Tokens) Token.Revoked = true;
            await _refreshRepo.SaveChangesAsync();
        }

        /*
        while the JWT is quite comprehensive, and extremely useful in reducing the amount of backend calls needed
        for the loggen in user (all his basic data is easily displayed here), the UserInfoResponse DTO will still be
        fully necessary for displaying the data of OTHER users on the platfor :/
        */
        private async Task<string> GenerateJwtAsync(User User)
        {
            var Key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
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
                new Claim("joined", User.DateJoined.ToString("dd/MM/yyyy HH:mm")),
                new Claim("listsCount", User.Lists.Count.ToString()),
                new Claim("followersCount", User.Followers.Count.ToString()),
                new Claim("followingCount", User.Following.Count.ToString()),
                new Claim("blockedCount", User.Blocked.Count.ToString()),
                new Claim("reviewsCount", User.Reviews.Count.ToString()),
                new Claim("likes", (User.LikedComments.Count + User.LikedLists.Count + User.LikedReviews.Count).ToString()),
                new Claim("watched", User.WatchedFilms.Count.ToString())
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

        private async Task<RefreshToken> GenerateRefreshTokenAsync(User User)
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
    }
}
