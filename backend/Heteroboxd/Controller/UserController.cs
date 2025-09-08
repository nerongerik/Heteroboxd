using Heteroboxd.Models.DTO;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("users")]
    public class UserController
    {
        //GET endpoints -> limited public access

        [HttpGet]
        public IActionResult GetAllUsers()
        {
            //retrives all users from database
            //probably useless; consider pagination, sorting, filtering
            return null;
        }

        [HttpGet("{UserId}")]
        public IActionResult GetUser(string UserId)
        {
            //retrives specific user from database
            return null;
        }

        [HttpGet("user-watchlist/{UserId}")]
        public IActionResult GetUserWatchlist(string UserId)
        {
            //retrives a specific user's watchlist from database
            return null;
        }

        [HttpGet("user-favorites/{UserId}")]
        public IActionResult GetUserFavorites(string UserId)
        {
            //retrives a specific user's favorites from database
            return null;
        }

        [HttpGet("user-relationships/{UserId}")]
        public IActionResult GetUserRelationships(string UserId)
        {
            //retrives a specific user's relationships (followers, following, blocked) from database
            return null;
        }

        [HttpGet("user-likes/{UserId}")]
        public IActionResult GetUserLikes(string UserId)
        {
            //retrives a specific user's likes (reviews, comments, lists) from database
            return null;
        }

        [HttpGet("search")]
        public IActionResult SearchUsers([FromQuery] string Search)
        {
            //searches for user, probably simpled name-based search
            return null;
        }
    }
}
