namespace Heteroboxd.Models
{
    public class Celebrity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? HeadshotUrl { get; set; }

        public Celebrity(int Id, string Name, string? Description, string? HeadshotUrl)
        {
            this.Id = Id;
            this.Name = Name;
            this.Description = Description;
            this.HeadshotUrl = HeadshotUrl;
        }

        public void UpdateFields(Celebrity Celebrity)
        {
            this.Name = Celebrity.Name;
            this.Description = Celebrity.Description;
            this.HeadshotUrl = Celebrity.HeadshotUrl;
        }
    }
}