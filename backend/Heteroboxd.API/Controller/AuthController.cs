using Heteroboxd.API.Service;
using Heteroboxd.Shared.Models.DTO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.API.Controller
{
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
                return Ok(await _service.SyncCountries(LastSync));
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
                return Ok(new { PresignedUrl = await _service.Register(Request) });
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
                var Response = await _service.Login(Request);
                return Response.Success ? Ok(new { jwt = Response.Jwt, refresh = Response.RefreshToken!.Token }) : Unauthorized();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("admin")]
        [Authorize]
        public async Task<IActionResult> AuthorizeAdmin(string Key)
        {
            //never log the admin key
            try
            {
                var Response = _service.VerifyAdminKey(Key);
                return Response.Success ? Ok(Response.AdminToken) : BadRequest();
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
                await _service.Logout(Token, UserId);
                return Ok();
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
                var Response = await _service.Refresh(Token);
                return Response.Success ? Ok(new { jwt = Response.Jwt, refresh = Response.RefreshToken!.Token }) : Unauthorized();
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
            return Ok(); //prevent user enumeration
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest Request)
        {
            _logger.LogInformation($"ResetPassword endpoint hit for {Request.UserId}");
            var Response = await _service.ResetPassword(Request);
            return Response ? Ok() : BadRequest();
        }
    }

}