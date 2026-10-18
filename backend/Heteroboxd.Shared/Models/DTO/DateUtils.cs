using System.Globalization;

namespace Heteroboxd.Shared.Models.DTO
{
    public static class DateUtils
    {
        public static string ToUtcIso8601(DateTime Date)
        {
            var UtcDate = Date.Kind switch
            {
                DateTimeKind.Utc => Date,
                DateTimeKind.Local => Date.ToUniversalTime(),
                _ => DateTime.SpecifyKind(Date, DateTimeKind.Utc)
            };

            return UtcDate.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
        }

        public static bool TryParseUtc(string Value, out DateTime Date) =>
            DateTime.TryParse(
                Value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out Date
            );
    }
}
