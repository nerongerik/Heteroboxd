using Heteroboxd.Models.DTO;
using Heteroboxd.Models;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface INotificationService
    {
        Task<List<NotificationInfoResponse>> GetNotificationsByUser(string UserId);
        Task AddNotification(string Title, string Text, string UserId);
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

        public async Task<List<NotificationInfoResponse>> GetNotificationsByUser(string UserId)
        {
            var UsersNotifications = await _repo.GetByUserAsync(Guid.Parse(UserId));
            return UsersNotifications.Select(n => new NotificationInfoResponse(n)).ToList();
        }

        public async Task AddNotification(string Title, string Text, string UserId)
        {
            _repo.Create(new Notification(Title, Text, Guid.Parse(UserId)));
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
