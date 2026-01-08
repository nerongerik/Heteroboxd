using FirebaseAdmin.Messaging;
using Heteroboxd.Models;
using Heteroboxd.Models.DTO;
using Heteroboxd.Models.Enums;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface INotificationService
    {
        Task<PagedNotificationResponse> GetNotificationsByUser(string UserId, int Page, int PageSize);
        Task<int> AnyNewNotifications(string UserId);
        Task AddNotification(string Text, NotificationType Type, Guid UserId);
        Task ReadAll(string UserId);
        Task UpdateNotification(string NotificationId);
        Task DeleteNotification(string NotificationId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;
        private readonly IUserRepository _userRepo;

        public NotificationService(INotificationRepository repo, IUserRepository userRepo)
        {
            _repo = repo;
            _userRepo = userRepo;
        }

        public async Task<PagedNotificationResponse> GetNotificationsByUser(string UserId, int Page, int PageSize)
        {
            var (Notifications, TotalCount) = await _repo.GetByUserPagedAsync(Guid.Parse(UserId), Page, PageSize);
            return new PagedNotificationResponse
            {
                Page = Page,
                PageSize = PageSize,
                TotalCount = TotalCount,
                Notifications = Notifications.Select(n => new NotificationInfoResponse(n)).ToList()
            };
        }

        public async Task<int> AnyNewNotifications(string UserId) =>
            await _repo.CountUnread(Guid.Parse(UserId));

        public async Task AddNotification(string Text, NotificationType Type, Guid UserId)
        {
            Models.Notification Notification = new Models.Notification(Text, Type, UserId);
            _repo.Create(Notification);
            await _repo.SaveChangesAsync();
        }

        public async Task ReadAll(string UserId)
        {
            List<Models.Notification> Notifications = await _repo.GetByUserAsync(Guid.Parse(UserId));
            foreach (var n in Notifications.Where(n => !n.Read))
            {
                n.Read = true;
                _repo.Update(n);
            }
            await _repo.SaveChangesAsync();
        }

        public async Task UpdateNotification(string NotificationId)
        {
            var Notification = await _repo.GetByIdAsync(Guid.Parse(NotificationId));
            if (Notification == null) throw new KeyNotFoundException();
            Notification.Read = true;
            _repo.Update(Notification);
            await _repo.SaveChangesAsync();
        }

        public async Task DeleteNotification(string NotificationId)
        {
            var Notification = await _repo.GetByIdAsync(Guid.Parse(NotificationId));
            if (Notification == null) throw new KeyNotFoundException();
            _repo.Delete(Notification);
            await _repo.SaveChangesAsync();
        }
    }
}
