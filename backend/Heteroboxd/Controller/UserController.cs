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

        //POST endpoints -> possibly useless, might need seperate auth controller

        [HttpPost]
        public IActionResult CreateUser([FromBody] CreateUserRequest request)
        {
            //creates a new user in the database
            //probably useless, might need seperate auth controller
            return null;
        }

        //PUT endpoints -> protected, user can only modify their own data

        [HttpPut]
        public IActionResult UpdateUser([FromBody] UpdateUserRequest request)
        {
            //updates a specific user's data in the database
            //only basic data (name, password, picture, bio, tier)
            return null;
        }

        [HttpPut("watchlist/{UserId}")]
        public IActionResult UpdateUserWatchlist(string UserId, [FromBody] string FilmId)
        {
            //adds or removes a film from the user's watchlist
            return null;
        }

        [HttpPut("favorites/{UserId}")]
        public IActionResult UpdateUserFavorites(string UserId, [FromBody] List<string> FilmIds)
        {
            //updates the user's top 5 films
            return null;
        }

        [HttpPut("relationships/{UserId}/{TargetId}")]
        public IActionResult UpdateUserRelationships(string UserId, string TargetId, [FromQuery] string Action)
        {
            //actions: ?action=follow/unfollow/block/unblock/add-follower/remove-follower
            return null;
        }

        [HttpPut("likes/{UserId}")]
        public IActionResult UpdateUserLikes(string UserId, [FromBody] UpdateUserLikesRequest request)
        {
            //updates the user's likes (reviews, comments, lists)
            return null;
        }

        [HttpPut("track-film/{UserId}/{FilmId}")]
        public IActionResult TrackUserFilm(string UserId, string FilmId, [FromQuery] string Action)
        {
            //actions: ?action=watched/rewatched/unwatched
            //for the frontend: never delete a UserWatchedFilm, just set the times watched to 0 when unwatched is triggered. display films differently based on this value
            return null;
        }

        //DELETE endpoints -> limited private access, ADMIN can delete any user, user can delete their own account

        [HttpDelete("{UserId}")]
        public IActionResult DeleteUser(string UserId)
        {
            //deletes a specific user from the database
            //probably just sets a "Deleted" flag to true, rather than actually deleting the user
            return null;
        }
    }
}
