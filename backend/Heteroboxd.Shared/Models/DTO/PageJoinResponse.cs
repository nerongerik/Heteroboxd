namespace Heteroboxd.Shared.Models.DTO
{
    public class PagedResponse<T>
    {
        public int TotalCount { get; set; }
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

    public record JoinedReviewFilm(Review Review, Film Film);

    public record JoinedListEntries(JoinResponse<UserList, User?> List, List<JoinResponse<ListEntry, Film>?> Entries);
}
