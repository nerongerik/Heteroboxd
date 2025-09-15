using Microsoft.Extensions.Primitives;

namespace Heteroboxd.Models.DTO
{
    public class UserInfoResponse
    {
        public UserInfoResponse(User User)
        { 
        }
    }
    public class CreateUserRequest
    {
    }

    public class UpdateUserRequest
    {
    }

    public class UpdateUserLikesRequest
    {
        string UserId { get; set; }
    }

    public class ReportUserRequest
    {
        public string Reason { get; set; }
        public string? Description { get; set; }
        public string TargetId { get; set; }
    }
}
