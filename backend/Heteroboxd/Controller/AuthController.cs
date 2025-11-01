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
            await _service.Register(Request);
            return Ok();
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
        try
        {
            _logger.LogInformation($"Login endpoint hit with Email: {Request.Email} and Password: {Request.Password}");
            var Result = await _service.Login(Request);

            if (Request.Device.Equals("web"))
            {
                Response.Cookies.Append("refreshToken", Result.RefreshToken!.Token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = Result.RefreshToken!.Expires
                });

                return Result.Success ? Ok(new { jwt = Result.Jwt }) : Unauthorized();
            }
            else
            {
                return Result.Success ? Ok(new { jwt = Result.Jwt, refresh = Result.RefreshToken }) : Unauthorized();
            }
        }
        catch
        {
            return StatusCode(500);
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest LogoutRequest)
    {
        try
        {
            if (LogoutRequest.Token == null) //web
            {
                foreach (var HttpOnly in Request.Cookies) //will there ever be more than one?
                {
                    var Result = await _service.Logout(HttpOnly.Value, LogoutRequest.UserId);
                    if (!Result) continue;
                    else return Ok();
                }
                return BadRequest();
            }
            else //mobile
            {
                var Result = await _service.Logout(LogoutRequest.Token, LogoutRequest.UserId);
                return Result ? Ok() : BadRequest();
            }
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
        try
        {
            if (RefreshRequest.Token == null) //web
            {
                foreach (var HttpOnly in Request.Cookies) //will there ever be more than one?
                {
                    var Result = await _service.Refresh(HttpOnly.Value);
                    if (!Result.Success) continue;
                    else
                    {
                        Response.Cookies.Append("refreshToken", Result.RefreshToken!.Token, new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict,
                            Expires = Result.RefreshToken!.Expires
                        });

                        return Ok(new { jwt = Result.Jwt });
                    }
                }
                return BadRequest();
            }
            else //mobile
            {
                var Result = await _service.Refresh(RefreshRequest.Token);
                return Result.Success ? Ok(new { jwt = Result.Jwt, refresh = Result.RefreshToken }) : Unauthorized();
            }
        }
        catch
        {
            return StatusCode(500);
        }
    }
}
