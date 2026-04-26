namespace Heteroboxd.Shared.Models.DTO
{
    public class FilmInfoResponse
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? OriginalTitle { get; set; }
        public List<string> Country { get; set; }
        public List<string> Genres { get; set; }
        public string Tagline { get; set; }
        public string Synopsis { get; set; }
        public string PosterUrl { get; set; }
        public string? BackdropUrl { get; set; }
        public int Length { get; set; }
        public string Date { get; set; }
        public int WatchCount { get; set; }
        public Dictionary<int, string>? Collection { get; set; }
        public List<CelebrityCreditInfoResponse>? CastAndCrew { get; set; }

        public FilmInfoResponse(Film Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>>? Credits = null)
        {
            this.Id = Film.Id;
            this.Title = Film.Title;
            this.OriginalTitle = Film.OriginalTitle;
            this.Country = Film.Country.ToList();
            this.Genres = Film.Genres.ToList();
            this.Tagline = Film.Tagline;
            this.Synopsis = Film.Synopsis;
            this.PosterUrl = Film.PosterUrl;
            this.BackdropUrl = Film.BackdropUrl;
            this.Length = Film.Length;
            this.Date = Film.Date.ToString("dd/MM/yyyy HH:mm");
            this.WatchCount = Film.WatchCount;
            this.Collection = Film.Collection;
            if (Credits != null)
            {
                this.CastAndCrew = Credits.SelectMany(x => x.Joined.Select(y => new CelebrityCreditInfoResponse(x.Item, y))).ToList();
            }
            else this.CastAndCrew = null;
        }
    }

    public class WatchlistEntryInfoResponse
    {
        public string Id { get; set; }
        public string Date { get; set; }
        public int FilmId { get; set; }
        public string FilmTitle { get; set; }
        public string FilmDate { get; set; }
        public string FilmPosterUrl { get; set; }

        public WatchlistEntryInfoResponse(WatchlistEntry Entry, Film Film)
        {
            this.Id = Entry.Id.ToString();
            this.Date = Entry.Date.ToString("dd/MM/yyyy HH:mm");
            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmDate = Film.Date.ToString("dd/MM/yyyy HH:mm");
            this.FilmPosterUrl = Film.PosterUrl;
        }
    }

    public class UserWatchedFilmInfoResponse
    {
        public string Date { get; set; }
        public int TimesWatched { get; set; }

        public UserWatchedFilmInfoResponse(UserWatchedFilm UWF)
        {
            this.Date = UWF.Date.ToString("dd/MM/yyyy HH:mm");
            this.TimesWatched = UWF.TimesWatched;
        }
    }

    public class TrendingInfoResponse
    {
        public int FilmId { get; set; }
        public string Title { get; set; }
        public string FilmPosterUrl { get; set; }
        public int Rank { get; set; }
        public string LastSync { get; set; }
    }

    public class CelebrityInfoResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? HeadshotUrl { get; set; }
        public List<string>? Roles { get; set; }

        public CelebrityInfoResponse(Celebrity Celebrity, List<string>? Roles = null)
        {
            this.Id = Celebrity.Id;
            this.Name = Celebrity.Name;
            this.Description = Celebrity.Description;
            this.HeadshotUrl = Celebrity.HeadshotUrl;
            this.Roles = Roles;
        }
    }

    public class CelebrityCreditInfoResponse
    {
        public int? Id { get; set; }
        public string? Name { get; set; }
        public string? HeadshotUrl { get; set; }
        public string Role { get; set; }
        public string? Character { get; set; }
        public int? Order { get; set; }

        public CelebrityCreditInfoResponse(Celebrity Celebrity, CelebrityCredit Role)
        {
            this.Id = Role.CelebrityId;
            this.Name = Celebrity.Name;
            this.HeadshotUrl = Celebrity.HeadshotUrl;
            this.Role = Role.Role.ToString();
            this.Character = Role.Character;
            this.Order = Role.Order;
        }
    }

    public class ReviewInfoResponse
    {
        public string Id { get; set; }
        public double Rating { get; set; }
        public string? Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public bool Spoiler { get; set; }
        public bool NotificationsOn { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public string AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public string? AuthorPictureUrl { get; set; }
        public bool? Admin { get; set; }
        public bool? Pinned { get; set; }
        public int FilmId { get; set; }
        public string? FilmTitle { get; set; }
        public string FilmDate { get; set; }
        public string? FilmPosterUrl { get; set; }

        public ReviewInfoResponse(Review Review, User Author, Film Film)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;
            this.CommentCount = Review.CommentCount;

            this.AuthorId = Author.Id.ToString();
            this.AuthorName = Author.Name;
            this.AuthorPictureUrl = string.IsNullOrEmpty(Author.PictureUrl) ? Author.PictureUrl : Author.PictureUrl + $"?v={Author.PictureUrlCacheVersion}";
            this.Admin = Author.IsAdmin;
            this.Pinned = Author.PinnedReviewId == Review.Id;

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmDate = Film.Date.ToString("dd/MM/yyyy HH:mm");
            this.FilmPosterUrl = Film.PosterUrl;
        }

        public ReviewInfoResponse(Review Review, User Author)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;
            this.CommentCount = Review.CommentCount;

            this.AuthorId = Author.Id.ToString();
            this.AuthorName = Author.Name;
            this.AuthorPictureUrl = string.IsNullOrEmpty(Author.PictureUrl) ? Author.PictureUrl : Author.PictureUrl + $"?v={Author.PictureUrlCacheVersion}";
            this.Admin = Author.IsAdmin;
            this.Pinned = Author.PinnedReviewId == Review.Id;

            this.FilmId = Review.FilmId;
        }

        public ReviewInfoResponse(Review Review, Film Film)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;
            this.CommentCount = Review.CommentCount;

            this.AuthorId = Review.AuthorId.ToString();

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmDate = Film.Date.ToString("dd/MM/yyyy HH:mm");
            this.FilmPosterUrl = Film.PosterUrl;
        }

        public ReviewInfoResponse(Review Review)
        {
            this.Id = Review.Id.ToString();
            this.Rating = Review.Rating;
            this.Text = Review.Text;
            this.Date = Review.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Review.Flags;
            this.Spoiler = Review.Spoiler;
            this.NotificationsOn = Review.NotificationsOn;
            this.LikeCount = Review.LikeCount;
            this.CommentCount = Review.CommentCount;

            this.AuthorId = Review.AuthorId.ToString();

            this.FilmId = Review.FilmId;
        }

        public ReviewInfoResponse(Film Film)
        {
            this.Id = "";
            this.Text = "";
            this.Date = "";

            this.AuthorId = "";

            this.FilmId = Film.Id;
            this.FilmTitle = Film.Title;
            this.FilmDate = Film.Date.ToString("dd/MM/yyyy HH:mm");
            this.FilmPosterUrl = Film.PosterUrl;
        }
    }

    public class UserListInfoResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Ranked { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public bool NotificationsOn { get; set; }
        public int ListEntryCount { get; set; }
        public List<ListEntryInfoResponse?> Films { get; set; }
        public int LikeCount { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorPictureUrl { get; set; }
        public bool Admin { get; set; }
        public bool Pinned { get; set; }

        public UserListInfoResponse(UserList List, User Author)
        {
            this.Id = List.Id.ToString();
            this.Name = List.Name;
            this.Description = List.Description;
            this.Ranked = List.Ranked;
            this.Date = List.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = List.Flags;
            this.NotificationsOn = List.NotificationsOn;
            this.ListEntryCount = List.Size;
            this.Films = new();
            this.LikeCount = List.LikeCount;
            this.AuthorId = List.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorPictureUrl = string.IsNullOrEmpty(Author.PictureUrl) ? Author.PictureUrl : Author.PictureUrl + $"?v={Author.PictureUrlCacheVersion}";
            this.Admin = Author.IsAdmin;
            this.Pinned = Author.PinnedListId == List.Id;
        }

        public UserListInfoResponse(UserList List, List<JoinResponse<ListEntry, Film>?> Entries, User Author)
        {
            this.Id = List.Id.ToString();
            this.Name = List.Name;
            this.Description = List.Description;
            this.Ranked = List.Ranked;
            this.Date = List.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = List.Flags;
            this.NotificationsOn = List.NotificationsOn;
            this.ListEntryCount = List.Size;
            this.Films = Entries.Select(x => x == null ? null : (ListEntryInfoResponse?) new ListEntryInfoResponse(x.Item, x.Joined)).ToList();
            this.LikeCount = List.LikeCount;
            this.AuthorId = List.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorPictureUrl = string.IsNullOrEmpty(Author.PictureUrl) ? Author.PictureUrl : Author.PictureUrl + $"?v={Author.PictureUrlCacheVersion}";
            this.Admin = Author.IsAdmin;
            this.Pinned = Author.PinnedListId == List.Id;
        }
    }

    public class DelimitedUserListInfoResponse
    {
        public string ListId { get; set; }
        public string ListName { get; set; }
        public bool ContainsFilm { get; set; }
        public int Size { get; set; }
    }

    public class ListEntryInfoResponse
    {
        public string Id { get; set; }
        public int Position { get; set; }
        public string FilmTitle { get; set; }
        public string FilmDate { get; set; }
        public string FilmPosterUrl { get; set; }
        public int FilmId { get; set; }

        public ListEntryInfoResponse(ListEntry Entry, Film Film)
        {
            this.Id = Entry.Id.ToString();
            this.Position = Entry.Position;
            this.FilmTitle = Film.Title;
            this.FilmDate = Film.Date.ToString("dd/MM/yyyy HH:mm");
            this.FilmPosterUrl = Film.PosterUrl;
            this.FilmId = Film.Id;
        }
    }

    public class CommentInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public string AuthorId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorPictureUrl { get; set; }
        public bool Admin { get; set; }
        public string ReviewId { get; set; }

        public CommentInfoResponse(Comment Comment, User Author)
        {
            this.Id = Comment.Id.ToString();
            this.Text = Comment.Text;
            this.Date = Comment.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = Comment.Flags;
            this.AuthorId = Comment.AuthorId.ToString();
            this.AuthorName = Author.Name;
            this.AuthorPictureUrl = string.IsNullOrEmpty(Author.PictureUrl) ? Author.PictureUrl : Author.PictureUrl + $"?v={Author.PictureUrlCacheVersion}";
            this.Admin = Author.IsAdmin;
            this.ReviewId = Comment.ReviewId.ToString();
        }
    }

    public class UserInfoResponse
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string PictureUrl { get; set; }
        public string? Bio { get; set; }
        public string? Gender { get; set; }
        public bool Admin { get; set; }
        public string Date { get; set; }
        public int Flags { get; set; }
        public int WatchlistCount { get; set; }
        public int ListsCount { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public int BlockedCount { get; set; }
        public int ReviewsCount { get; set; }
        public int LikesCount { get; set; }
        public int WatchedCount { get; set; }
        public string? PinnedListId { get; set; }
        public string? PinnedReviewId { get; set; }

        public UserInfoResponse(User User, int WatchlistCount = 0, int UserListCount = 0, int ReviewCount = 0, int WatchedFilmCount = 0, int LikesCount = 0, int FollowerCount = 0, int FollowingCount = 0, int BlockedCount = 0)
        {
            this.Id = User.Id.ToString();
            this.Name = User.Name;
            this.PictureUrl = string.IsNullOrEmpty(User.PictureUrl) ? User.PictureUrl : User.PictureUrl + $"?v={User.PictureUrlCacheVersion}";
            this.Bio = User.Bio;
            this.Gender = User.Gender.ToString();
            this.Admin = User.IsAdmin;
            this.Date = User.Date.ToString("dd/MM/yyyy HH:mm");
            this.Flags = User.Flags;
            this.WatchlistCount = WatchlistCount;
            this.ListsCount = UserListCount;
            this.FollowersCount = FollowerCount;
            this.FollowingCount = FollowingCount;
            this.BlockedCount = BlockedCount;
            this.ReviewsCount = ReviewCount;
            this.LikesCount = LikesCount;
            this.WatchedCount = WatchedFilmCount;
            this.PinnedListId = User.PinnedListId?.ToString();
            this.PinnedReviewId = User.PinnedReviewId?.ToString();
        }
    }

    public class DelimitedUserLikesInfoResponse
    {
        public PagedResponse<ReviewInfoResponse> LikedReviews { get; set; }
        public PagedResponse<UserListInfoResponse> LikedLists { get; set; }
    }

    public class DelimitedUserRelationshipsInfoResponse
    {
        public PagedResponse<UserInfoResponse> Following { get; set; }
        public PagedResponse<UserInfoResponse> Followers { get; set; }
        public PagedResponse<UserInfoResponse> Blocked { get; set; }
    }

    public class DelimitedUserFilmInfoResponse
    {
        public string FriendId { get; set; }
        public string FriendPictureUrl { get; set; }
        public string? ReviewId { get; set; }
        public double? Rating { get; set; }
    }

    public class NotificationInfoResponse
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public string Date { get; set; }
        public bool Read { get; set; }
        public string UserId { get; set; }

        public NotificationInfoResponse(Notification Notification)
        {
            this.Id = Notification.Id.ToString();
            this.Text = Notification.Text;
            this.Date = Notification.Date.ToString("dd/MM/yyyy HH:mm");
            this.Read = Notification.Read;
            this.UserId = Notification.UserId.ToString();
        }
    }

    public class CountryInfoResponse
    {
        public string Name { get; set; }
        public string Code { get; set; }
        public string LastSync { get; set; }
    }
}
