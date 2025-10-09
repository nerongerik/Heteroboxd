using Heteroboxd.Models.DTO;
using Heteroboxd.Models;
using Heteroboxd.Repository;

namespace Heteroboxd.Service
{
    public interface INotificationService
    {
        Task<List<NotificationInfoResponse>> GetAllNotifications();
        Task<NotificationInfoResponse> GetNotificationById(string NotificationId);
        Task<List<NotificationInfoResponse>> GetUsersNotifications(string UserId);
        Task CreateNotification(CreateNotificationRequest NotificationRequest);
        Task UpdateNotification(string NotificationId);
        Task LogicalDeleteNotification(string NotificationId);
    }

    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;

        public NotificationService(INotificationRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<NotificationInfoResponse>> GetAllNotifications()
        {
            var AllNotifications = await _repo.GetAllAsync();
            return AllNotifications.Select(n => new NotificationInfoResponse(n)).ToList();
        }

        public async Task<NotificationInfoResponse> GetNotificationById(string NotificationId)
        {
            var Notification = await _repo.GetByIdAsync(Guid.Parse(NotificationId));
            if (Notification == null) throw new KeyNotFoundException();
            return new NotificationInfoResponse(Notification);
        }

        public async Task<List<NotificationInfoResponse>> GetUsersNotifications(string UserId)
        {
            var UsersNotifications = await _repo.GetByUserIdAsync(Guid.Parse(UserId));
            return UsersNotifications.Select(n => new NotificationInfoResponse(n)).ToList();
        }

        public async Task CreateNotification(CreateNotificationRequest NotificationRequest)
        {
            Notification Notification = new Notification(NotificationRequest.Title, NotificationRequest.Text, Guid.Parse(NotificationRequest.UserId));
            _repo.Create(Notification);
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

        public async Task LogicalDeleteNotification(string NotificationId)
        {
            var Notification = await _repo.GetByIdAsync(Guid.Parse(NotificationId));
            if (Notification == null) throw new KeyNotFoundException();
            Notification.Deleted = true;
            _repo.Update(Notification);
            await _repo.SaveChangesAsync();
        }
    }
}
