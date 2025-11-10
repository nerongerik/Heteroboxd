using Heteroboxd.Models.Enums;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Primitives;
using System.Security.Claims;

namespace Heteroboxd.Models.DTO
{
    public class UserInfoResponse
    {
        //carries the same information about the user as jwt, different usecase
        public string Id { get; set; }
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public string? Gender { get; set; }
        public string Tier { get; set; }
        public string? Expiry { get; set; }
        public string Patron { get; set; }
        public string Joined { get; set; }
        public int Flags { get; set; }
        public string ListsCount { get; set; }
        public string FollowersCount { get; set; }
        public string FollowingCount { get; set; }
        public string BlockedCount { get; set; }
        public string ReviewsCount { get; set; }
        public string Likes { get; set; }
        public string Watched { get; set; }

        public UserInfoResponse(User User)
        {
            this.Id = User.Id.ToString();
            this.Name = User.Name;
            this.PictureUrl = User.PictureUrl;
            this.Bio = User.Bio;
            this.Gender = User.Gender.ToString();
            this.Tier = User.Tier.ToString();
            this.Expiry = User.TierExpiry != null ? User.TierExpiry?.ToString("dd/MM/yyyy HH:mm")! : null;
            this.Patron = User.IsPatron.ToString();
            this.Joined = User.DateJoined.ToString("dd/MM/yyyy HH:mm");
            this.Flags = User.Flags;
            this.ListsCount = User.Lists.Count.ToString();
            this.FollowersCount = User.Followers.Count.ToString();
            this.FollowingCount = User.Following.Count.ToString();
            this.BlockedCount = User.Blocked.Count.ToString();
            this.ReviewsCount = User.Reviews.Count.ToString();
            this.Likes = (User.LikedComments.Count + User.LikedLists.Count + User.LikedReviews.Count).ToString();
            this.Watched = User.WatchedFilms.Count.ToString();
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

    public class DonateRequest
    {
        public string UserId { get; set; }
        public string Amount { get; set; }
        public string Date { get; set; }
    }

    public class VerifyUserRequest
    {
        public string UserId { get; set; }
        public string Token { get; set; }
    }
}
