using Heteroboxd.Models.Enums;
using Microsoft.Extensions.Primitives;

namespace Heteroboxd.Models.DTO
{
    public class UserInfoResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public string DateJoined { get; private set; }
        public string Tier { get; set; }
        public string? TierExpiry { get; set; }
        public bool IsPatron { get; set; }

        public UserInfoResponse(User User)
        {
            this.Id = User.Id.ToString();
            this.Name = User.Name;
            this.PictureUrl = User.PictureUrl;
            this.Bio = User.Bio;
            this.DateJoined = User.DateJoined.ToString("dd/MM/yyyy HH:mm");
            this.Tier = User.Tier.ToString();
            if (User.TierExpiry != null)
            {
                this.TierExpiry = User.TierExpiry?.ToString("dd/MM/yyyy HH:mm");
            }
            this.IsPatron = User.IsPatron;
        }
    }

    public class UpdateUserRequest
    {
        public string UserId { get; set; }
        public string? Name { get; set; }
        public string? PictureUrl { get; set; }
        public string? Bio { get; set; }
    }

    public class UpdateUserLikesRequest
    {
        public string UserId { get; set; }
        public string? ReviewId { get; set; }
        public string? CommentId { get; set; }
        public string? ListId { get; set; }
    }

    public class ReportUserRequest
    {
        public string Reason { get; set; }
        public string? Description { get; set; }
        public string TargetId { get; set; }
    }

    public class DonateRequest
    {
        public string UserId { get; set; }
        public string Amount { get; set; }
        public string Date { get; set; }
    }
}
