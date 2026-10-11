using Heteroboxd.Shared.Models.DTO;
using Heteroboxd.Shared.Models;
using Heteroboxd.Shared.Repository;
using Heteroboxd.Shared.Integrations;

namespace Heteroboxd.API.Service
{
    public interface INotificationService
    {
        Task<PagedResponse<NotificationInfoResponse>> GetNotificationsByUser(string UserId, int Page, int PageSize);
        Task<int> AnyNewNotifications(string UserId);
        Task AddNotification(List<Notification> Notifications);
        Task ReadAll(string UserId);
        Task UpdateNotification(string NotificationId);
        Task DeleteNotification(string NotificationId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;
        private readonly IPushNotificationService _pushNotificationService;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            INotificationRepository repo,
            IPushNotificationService pushNotificationService,
            ILogger<NotificationService> logger)
        {
            _repo = repo;
            _pushNotificationService = pushNotificationService;
            _logger = logger;
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

        public async Task AddNotification(List<Notification> Notifications)
        {
            await _repo.CreateAsync(Notifications);

            try
            {
                await _pushNotificationService.SendAsync(Notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    "Push delivery failed safely after notification persistence; exception type {ExceptionType}, notification count {NotificationCount}",
                    ex.GetType().Name,
                    Notifications.Count);
            }
        }

        public async Task ReadAll(string UserId) =>
            await _repo.MarkAllReadAsync(Guid.Parse(UserId));

        public async Task UpdateNotification(string NotificationId) =>
            await _repo.UpdateAsync(Guid.Parse(NotificationId));

        public async Task DeleteNotification(string NotificationId) =>
            await _repo.DeleteAsync(Guid.Parse(NotificationId));
    }
}
