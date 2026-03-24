namespace Heteroboxd.Shared.Models
{
    public class Country
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public DateTime LastSync { get; set; }

        public Country(string Name, string Code)
        {
            this.Name = Name;
            this.Code = Code;
            this.LastSync = DateTime.UtcNow;
        }
    }
}
