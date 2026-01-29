using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Security.Claims;

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

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest Request)
    {
        _logger.LogInformation($"Register endpoint hit with Email: {Request.Email}");
        try
        {
            var Response = await _service.Register(Request);
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

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest Request)
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

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest LogoutRequest)
    {
        _logger.LogInformation($"Logout endpoint hit with User: {LogoutRequest.UserId}");
        try
        {
            var Result = await _service.Logout(LogoutRequest.Token, LogoutRequest.UserId);
            return Result ? Ok() : BadRequest();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest RefreshRequest)
    {
        _logger.LogInformation($"Refresh endpoint hit with Refresh Token: {RefreshRequest.Token}");
        try
        {
            var Result = await _service.Refresh(RefreshRequest.Token);
            return Result.Success ? Ok(new { jwt = Result.Jwt, refresh = Result.RefreshToken!.Token }) : Unauthorized();
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest Request)
    {
        _logger.LogInformation($"Forgot Password endpoint hit for {Request.Email}");
        await _service.ForgotPassword(Request.Email);
        return Ok(); //prevents user enumeration
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest Request)
    {
        _logger.LogInformation($"Reset Password endpoint hit for {Request.UserId}");
        var Success = await _service.ResetPassword(Request);
        return Success ? Ok() : BadRequest();
    }
}
