using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService service, ILogger<AuthController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("country")]
    [AllowAnonymous]
    public async Task<IActionResult> Countries(string? LastSync = null)
    {
        _logger.LogInformation($"Countries endpoint hit.");
        try
        {
            var Response = await _service.SyncCountries(LastSync);
            return Ok(Response);
        }
        catch (ArgumentException)
        {
            return BadRequest();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest Request)
    {
        _logger.LogInformation($"Register endpoint hit with Email: {Request.Email}");
        try
        {
            var Response = await _service.Register(Request);
            return Ok(new { PresignedUrl = Response });
        }
        catch (ArgumentException)
        {
            return BadRequest();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginRequest Request)
    {
        _logger.LogInformation($"Login endpoint hit with Email: {Request.Email} and Password: {Request.Password}");
        try
        {
            var Result = await _service.Login(Request);
            return Result.Success ? Ok(new { jwt = Result.Jwt, refresh = Result.RefreshToken!.Token }) : Unauthorized();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("logout/{UserId}")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(string UserId, string? Token)
    {
        _logger.LogInformation($"Logout endpoint hit with User: {UserId}");
        try
        {
            var Result = await _service.Logout(Token, UserId);
            return Result ? Ok() : BadRequest();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(string? Token = null)
    {
        _logger.LogInformation($"Refresh endpoint hit with Refresh Token: {Token}");
        try
        {
            var Result = await _service.Refresh(Token);
            return Result.Success ? Ok(new { jwt = Result.Jwt, refresh = Result.RefreshToken!.Token }) : Unauthorized();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(string Email)
    {
        _logger.LogInformation($"ForgotPassword endpoint hit for {Email}");
        await _service.ForgotPassword(Email);
        return Ok(); //prevents user enumeration
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest Request)
    {
        _logger.LogInformation($"ResetPassword endpoint hit for {Request.UserId}");
        var Success = await _service.ResetPassword(Request);
        return Success ? Ok() : BadRequest();
    }
}
