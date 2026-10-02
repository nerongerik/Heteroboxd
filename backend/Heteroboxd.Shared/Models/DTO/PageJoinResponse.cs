namespace Heteroboxd.Shared.Models.DTO
{
    public class PagedResponse<T>
    {
        public int TotalCount { get; set; }
        public int? ThreadCount { get; set; }
        public int Page { get; set; }
        public List<T> Items { get; set; }
        public List<int>? Seen { get; set; }
        public int? SeenCount { get; set; }
        public T? Pinned { get; set; }
    }

    public class JoinResponse<T1, T2>
    {
        public T1 Item { get; set; }
        public T2 Joined { get; set; }
    }

    public static class PageUtils
    {
        public static List<T?> AddPadding<T>(List<T?> Items) where T : class =>
            Items.Concat(Enumerable.Repeat<T?>(null, (4 - Items.Count % 4) % 4)).ToList();
    }

    public record ReviewWithCounts(Review Review, int LikeCount, int CommentCount);

    public record JoinedReviewFilm(Review Review, Film Film, int LikeCount, int CommentCount);

    public record FilmDetails(Film Film, List<JoinResponse<Celebrity, List<CelebrityCredit>>> Credits, int WatchCount);

    public record JoinedUserList(UserList Item, User? Joined, int LikeCount, int ListEntryCount);

    public record JoinedListEntries(JoinedUserList List, List<JoinResponse<ListEntry, Film>?> Entries);

    public record JoinedCommentAuthor(Comment Item, User? Joined, string? RepliedUserName);
}
