using Heteroboxd.Data;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IConfiguration _config;
    private readonly IUserRepository _userRepo;
    private readonly HeteroboxdContext _context;

    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config, IUserRepository userRepo, HeteroboxdContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
        _userRepo = userRepo;
        _context = context;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] Heteroboxd.Models.DTO.RegisterRequest Request)
    {
        var Existing = await _userManager.FindByEmailAsync(Request.Email);
        if (Existing != null) return BadRequest(); //already exists user with such email

        User User = new User(Request.Name, Request.Email, Request.PictureUrl, Request.Bio);
        var Result = await _userManager.CreateAsync(User, Request.Password);
        if (!Result.Succeeded) return BadRequest(Result.Errors);

        //finish initializing the user
        User.Watchlist = new Watchlist(User.Id);
        User.Favorites = new UserFavorites(User.Id);

        _userRepo.Update(User);
        await _userRepo.SaveChangesAsync();

        // --- EMAIL SENDING LOGIC HERE ---
        return Ok(new UserInfoResponse(User));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] Heteroboxd.Models.DTO.LoginRequest Request)
    {
        var User = await _userManager.FindByEmailAsync(Request.Email);
        if (User == null || User.Deleted) return Unauthorized();

        var Check = await _signInManager.CheckPasswordSignInAsync(User, Request.Password, lockoutOnFailure: false);
        if (!Check.Succeeded) return Unauthorized();

        var Token = await GenerateJwt(User);
        var RefreshToken = await GenerateRefreshToken(User);

        return Ok(new
        {
            Token,
            RefreshToken = RefreshToken.Token,
            user = new UserInfoResponse(User)
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken([FromBody] string Token)
    {
        var ExistingToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == Token && !t.Used && !t.Revoked && t.Expires > DateTime.UtcNow);

        if (ExistingToken == null) return Unauthorized();

        ExistingToken.Used = true;

        var User = await _userManager.FindByIdAsync(ExistingToken.UserId.ToString());
        if (User == null || User.Deleted) return Unauthorized();

        var NewJwt = await GenerateJwt(User);
        var NewRefreshToken = await GenerateRefreshToken(User);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Token = NewJwt,
            RefreshToken = NewRefreshToken.Token
        });
    }

    private async Task<string> GenerateJwt(User User)
    {
        var Key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
        var Claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, User.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, User.Email ?? ""),
            new Claim("name", User.Name ?? ""),
            new Claim("tier", User.Tier.ToString()),
            new Claim(ClaimTypes.NameIdentifier, User.Id.ToString()),
        };

        //include roles if any
        var Roles = await _userManager.GetRolesAsync(User);
        foreach (var role in Roles) Claims.Add(new Claim(ClaimTypes.Role, role));

        var Creds = new SigningCredentials(new SymmetricSecurityKey(Key), SecurityAlgorithms.HmacSha256);
        var Token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: Claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: Creds
        );

        return new JwtSecurityTokenHandler().WriteToken(Token);
    }

    private async Task<RefreshToken> GenerateRefreshToken(User User)
    {
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            UserId = User.Id,
            Expires = DateTime.UtcNow.AddDays(365),
            Used = false,
            Revoked = false
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
        return refreshToken;
    }
}
