using Heteroboxd.Data;
using Heteroboxd.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Repository
{
    public interface INotificationRepository
    {
        Task<Notification?> GetByIdAsync(Guid NotificationId);
        Task<int> CountUnread(Guid UserId);
        Task<(List<Notification> Notifications, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize);
        void Create(Notification Notification);
        void Update(Notification Notification);
        Task MarkAllRead(Guid UserId);
        void Delete(Notification Notification);
        Task SaveChangesAsync();
    }

    public class NotificationRepository : INotificationRepository
    {
        private readonly HeteroboxdContext _context;

        public NotificationRepository(HeteroboxdContext context)
        {
            _context = context;
        }

        public async Task<Notification?> GetByIdAsync(Guid NotificationId) =>
            await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == NotificationId);

        public async Task<int> CountUnread(Guid UserId) =>
            await _context.Notifications.Where(n => n.UserId == UserId && !n.Read).CountAsync();

        public async Task<(List<Notification> Notifications, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize)
        {
            var UserQuery = _context.Notifications
                .Where(n => n.UserId == UserId)
                .OrderByDescending(n => n.Date);

            var TotalCount = await UserQuery.CountAsync();

            var Notifications = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Notifications, TotalCount);
        }

        public void Create(Notification Notification)
        {
            _context.Notifications.Add(Notification);
        }

        public void Update(Notification Notification)
        {
            _context.Notifications.Update(Notification);
        }

        public async Task MarkAllRead(Guid UserId) =>
            await _context.Notifications
                .Where(n => n.UserId == UserId && !n.Read)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true));

        public void Delete(Notification Notification)
        {
            _context.Notifications.Remove(Notification);
        }

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}
