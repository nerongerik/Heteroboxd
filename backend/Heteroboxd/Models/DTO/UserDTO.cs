namespace Heteroboxd.Models.DTO
{
    public class UserInfoResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public string? Gender { get; set; }
        public string Tier { get; set; }
        public string? Expiry { get; set; }
        public bool Patron { get; set; }
        public string Joined { get; set; }
        public int Flags { get; set; }
        public int WatchlistCount { get; set; }
        public int ListsCount { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int BlockedCount { get; set; }
        public int ReviewsCount { get; set; }
        public int Likes { get; set; }
        public int Watched { get; set; }

        public UserInfoResponse(User User)
        {
            this.Id = User.Id.ToString();
            this.Name = User.Name;
            this.PictureUrl = User.PictureUrl;
            this.Bio = User.Bio;
            this.Gender = User.Gender.ToString();
            this.Tier = User.Tier.ToString().ToLower();
            this.Expiry = User.TierExpiry != null ? User.TierExpiry?.ToString("dd/MM/yyyy HH:mm")! : null;
            this.Patron = User.IsPatron;
            this.Joined = User.DateJoined.ToString("dd/MM/yyyy HH:mm");
            this.Flags = User.Flags;
            this.WatchlistCount = User.Watchlist != null ? User.Watchlist.Films.Count : 0;
            this.ListsCount = User.Lists != null ? User.Lists.Count : 0;
            this.FollowersCount = User.Followers != null ? User.Followers.Count : 0;
            this.FollowingCount = User.Following != null ?  User.Following.Count : 0;
            this.BlockedCount = User.Blocked != null ? User.Blocked.Count : 0;
            this.ReviewsCount = User.Reviews != null ? User.Reviews.Count : 0;
            this.Likes = (User.LikedLists != null && User.LikedReviews != null) ? (User.LikedLists.Count + User.LikedReviews.Count) : 0;
            this.Watched = User.WatchedFilms != null ? User.WatchedFilms.Count : 0;
        }
    }

    public class LikesDelimitedResponse
    {
        public PagedResponse<ReviewInfoResponse> LikedReviews { get; set; }
        public PagedResponse<UserListInfoResponse> LikedLists { get; set; }
    }

    public class RelationshipsDelimitedResponse
    {
        public PagedResponse<UserInfoResponse> Following { get; set; }
        public PagedResponse<UserInfoResponse> Followers { get; set; }
        public PagedResponse<UserInfoResponse> Blocked { get; set; }
    }

    public class FriendFilmResponse
    {
        public string FriendId { get; set; }
        public string FriendProfilePictureUrl { get; set; }
        public string DateWatched { get; set; }
        public string? ReviewId { get; set; }
        public double? Rating { get; set; }
    }

    public class UpdateUserRequest
    {
        public string UserId { get; set; }
        public string? Name { get; set; }
        public string? PictureUrl { get; set; }
        public string? Bio { get; set; }
    }

    public class UpdateLikesRequest
    {
        public string UserId { get; set; } //who likes it
        public string UserName { get; set; } //his display
        public string AuthorId { get; set; } //who gets a notification
        public string? ReviewId { get; set; } //target
        public string? FilmTitle { get; set; } //if review
        public string? ListId { get; set; } //target
        public string? ListName { get; set; } //if list
        public int LikeChange { get; set; } // +1 or -1
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
