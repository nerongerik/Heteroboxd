using Heteroboxd.Shared.Data;
using Heteroboxd.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace Heteroboxd.Shared.Repository
{
    public interface INotificationRepository
    {
        Task<Notification?> GetByIdAsync(Guid NotificationId);
        Task<int> CountUnreadAsync(Guid UserId);
        Task<(List<Notification> Notifications, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize);
        Task CreateAsync(Notification Notification);
        Task UpdateAsync(Guid NotificationId);
        Task MarkAllReadAsync(Guid UserId);
        Task DeleteAsync(Guid NotificationId);
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
                .AsNoTracking()
                .FirstOrDefaultAsync(n => n.Id == NotificationId);

        public async Task<int> CountUnreadAsync(Guid UserId) =>
            await _context.Notifications
                .AsNoTracking()
                .CountAsync(n => n.UserId == UserId && !n.Read);

        public async Task<(List<Notification> Notifications, int TotalCount)> GetByUserAsync(Guid UserId, int Page, int PageSize)
        {
            var UserQuery = _context.Notifications
                .AsNoTracking()
                .Where(n => n.UserId == UserId)
                .OrderByDescending(n => n.Date).ThenBy(n => n.Id);

            var TotalCount = await UserQuery.CountAsync();

            var Notifications = await UserQuery
                .Skip((Page - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            return (Notifications, TotalCount);
        }

        public async Task CreateAsync(Notification Notification)
        {
            _context.Notifications.Add(Notification);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Guid NotificationId) =>
            await _context.Notifications
                .Where(n => n.Id == NotificationId)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true));

        public async Task MarkAllReadAsync(Guid UserId) =>
            await _context.Notifications
                .Where(n => n.UserId == UserId && !n.Read)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true));

        public async Task DeleteAsync(Guid NotificationId) =>
            await _context.Notifications
                .Where(n => n.Id == NotificationId)
                .ExecuteDeleteAsync();
    }
}
