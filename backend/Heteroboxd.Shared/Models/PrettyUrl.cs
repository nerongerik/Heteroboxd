using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Heteroboxd.Shared.Models
{
    public static class PrettyUrl
    {
        private static readonly Regex NonSlugChars = new(@"[^a-z0-9]+", RegexOptions.Compiled);
        private static readonly Regex TrimHyphens = new(@"(^-+|-+$)", RegexOptions.Compiled);
        private static readonly Regex EmailAlias = new(@"\+.*$", RegexOptions.Compiled);

        public static string BuildFilmSlug(string Title, DateTime Date) =>
            $"{Slugify(Title, "film")}-{Date.Year}";

        public static string BuildUserName(string Email)
        {
            var LocalPart = Email.Split('@')[0].ToLowerInvariant();
            LocalPart = EmailAlias.Replace(LocalPart, "");
            LocalPart = LocalPart.Replace(".", "");

            var UserName = Slugify(LocalPart, "user");
            return UserName == "edit" ? "edit-user" : UserName;
        }

        private static string Slugify(string RawValue, string Fallback)
        {
            var Decomposed = (RawValue ?? "").Normalize(NormalizationForm.FormD);
            var Builder = new StringBuilder(Decomposed.Length);

            foreach (var Character in Decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(Character) != UnicodeCategory.NonSpacingMark)
                {
                    Builder.Append(Character);
                }
            }

            var Slug = Builder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
            Slug = NonSlugChars.Replace(Slug, "-");
            Slug = TrimHyphens.Replace(Slug, "");

            return string.IsNullOrWhiteSpace(Slug) ? Fallback : Slug;
        }
    }
}
