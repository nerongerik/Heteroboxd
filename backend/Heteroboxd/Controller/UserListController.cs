using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("lists")]
    public class UserListController
    {
        //GET endpoints -> limited public access

        [HttpGet]
        public IActionResult GetAllLists()
        {
            //retrives all lists from database
            //probably useless; consider pagination, sorting, filtering
            return null;
        }

        [HttpGet("{UserListId}")]
        public IActionResult GetList(string UserListId)
        {
            //retrives specific list from database
            return null;
        }

        [HttpGet("user-lists/{UserId}")]
        public IActionResult GetListsByAuthor(string UserId)
        {
            //retrives all lists by a specific user from database
            return null;
        }

        [HttpGet("search")]
        public IActionResult SearchLists([FromQuery] UserListSearchRequest Search)
        {
            //searches lists by name or description
            //consider close-matches, partial matches, etc.
            return null;
        }

        //POST endpoints -> public access

        [HttpPost]
        public IActionResult AddList([FromBody] CreateUserListRequest ListRequest)
        {
            //adds a new list to the database
            return null;
        }

        //PUT endpoints -> limited public access (only for their own lists)

        [HttpPut]
        public IActionResult UpdateList([FromBody] UpdateUserListRequest ListRequest)
        {
            //updates an existing list in the database
            //toRemove: ListEntryId[]
            //toAdd: FilmId[]
            //other fields: name, description, ranked
            return null;
        }

        [HttpPut("like-count/{UserListId}")]
        public IActionResult UpdateLikeCount(string UserListId, [FromBody] int LikeChange)
        {
            //updates the like count of a list
            //LikeChange should be +1 or -1
            return null;
        }

        [HttpPut("toggle-notifications/{UserListId}")]
        public IActionResult ToggleNotifications(string UserListId)
        {
            //toggles the notifications setting for the list
            return null;
        }

        //DELETE endpoints -> limited public access (only for their own lists), ADMIN privileges for any list
        [HttpDelete("{UserListId}")]
        public IActionResult DeleteList(string UserListId)
        {
            //deletes a list from the database (logical delete)
            //normal users can only delete their own lists, admins can delete any list
            return null;
        }
    }
}
