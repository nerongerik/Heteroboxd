using Heteroboxd.Models.DTO;
using Heteroboxd.Models;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface INotificationService
    {
        Task<PagedResponse<NotificationInfoResponse>> GetNotificationsByUser(string UserId, int Page, int PageSize);
        Task<int> AnyNewNotifications(string UserId);
        Task AddNotification(string Text, Guid UserId);
        Task ReadAll(string UserId);
        Task UpdateNotification(string NotificationId);
        Task DeleteNotification(string NotificationId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;

        public NotificationService(INotificationRepository repo)
        {
            _repo = repo;
        }

        public async Task<PagedResponse<NotificationInfoResponse>> GetNotificationsByUser(string UserId, int Page, int PageSize)
        {
            var (Notifications, TotalCount) = await _repo.GetByUserAsync(Guid.Parse(UserId), Page, PageSize);
            return new PagedResponse<NotificationInfoResponse>
            {
                Page = Page,
                TotalCount = TotalCount,
                Items = Notifications.Select(n => new NotificationInfoResponse(n)).ToList()
            };
        }

        public async Task<int> AnyNewNotifications(string UserId) =>
            await _repo.CountUnreadAsync(Guid.Parse(UserId));

        public async Task AddNotification(string Text, Guid UserId) =>
            await _repo.CreateAsync(new Notification(Text, UserId));

        public async Task ReadAll(string UserId) =>
            await _repo.MarkAllReadAsync(Guid.Parse(UserId));

        public async Task UpdateNotification(string NotificationId) =>
            await _repo.UpdateAsync(Guid.Parse(NotificationId));

        public async Task DeleteNotification(string NotificationId) =>
            await _repo.DeleteAsync(Guid.Parse(NotificationId));
    }
}
