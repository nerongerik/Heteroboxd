using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;

    public AuthController(IAuthService authService)
    {
        this._service = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest Request)
    {
        var Result = await _service.RegisterAsync(Request);
        return Result.Success ? Ok(Result.User) : BadRequest(Result.Error);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest Request)
    {
        var Result = await _service.LoginAsync(Request);
        return Result.Success ? Ok(new { Result.Jwt, Result.RefreshToken, user = Result.User }) : Unauthorized();
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest Request)
    {
        var UserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var Success = await _service.LogoutAsync(Request.Token, UserId);
        return Success ? Ok() : BadRequest();
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest Request)
    {
        var Result = await _service.RefreshTokenAsync(Request.Token);
        return Result.Success ? Ok(new { Token = Result.Jwt, RefreshToken = Result.RefreshToken }) : Unauthorized();
    }
}
