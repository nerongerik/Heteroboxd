using Heteroboxd.Data;
using Heteroboxd.Models;
using System.Linq;
using System.Text.Json;

namespace Heteroboxd.Integrations
{
    public interface ITMDBLoader
    {
        void LoadFilms(int Step);
        void LoadCelebs(int Step);
        void LoadCredits(int Step);
    }
    public class TMDBLoader : ITMDBLoader
    {
        private readonly IConfiguration _config;
        private readonly HeteroboxdContext _context;

        public TMDBLoader(IConfiguration config, HeteroboxdContext context)
        {
            _config = config;
            _context = context;
        }

        public void LoadFilms(int Step)
        {
            if (!Directory.Exists(_config["TMDB:FilmSerialPath"]!)) throw new DirectoryNotFoundException($"{_config["TMDB:FilmSerialPath"]!} not found.");

            while (true)
            {
                var Batch = Directory.EnumerateFiles(_config["TMDB:FilmSerialPath"]!, "*.json").Take(Step).ToList();
                if (Batch.Count == 0) break;

                foreach (var JsonFile in Batch)
                {
                    try
                    {
                        string Json = File.ReadAllText(JsonFile);
                        Film? Film = JsonSerializer.Deserialize<Film>(Json);
                        if (Film != null)
                        {
                            _context.Films.Add(Film);
                        }
                    }
                    catch
                    {
                        continue; //no reason to let one bad file stop the whole process
                    }
                }

                _context.SaveChanges();

                foreach (var JsonFile in Batch)
                {
                    File.Delete(JsonFile);
                }
            }
        }

        public void LoadCelebs(int Step)
        {
            if (!Directory.Exists(_config["TMDB:CelebSerialPath"]!)) throw new DirectoryNotFoundException($"{_config["TMDB:CelebSerialPath"]!} not found.");

            while (true)
            {
                var Batch = Directory.EnumerateFiles(_config["TMDB:CelebSerialPath"]!, "*.json").Take(Step).ToList();
                if (Batch.Count == 0) break;

                foreach (var JsonFile in Batch)
                {
                    try
                    {
                        string Json = File.ReadAllText(JsonFile);
                        Celebrity? Celebrity = JsonSerializer.Deserialize<Celebrity>(Json);
                        if (Celebrity != null)
                        {
                            _context.Celebrities.Add(Celebrity);
                        }
                    }
                    catch
                    {
                        continue; //no reason to let one bad file stop the whole process
                    }
                }

                _context.SaveChanges();

                foreach (var JsonFile in Batch)
                {
                    File.Delete(JsonFile);
                }
            }
        }

        public void LoadCredits(int Step)
        {
            if (!Directory.Exists(_config["TMDB:CreditSerialPath"]!)) throw new DirectoryNotFoundException();

            while (true)
            {
                var Batch = Directory.EnumerateFiles(_config["TMDB:CreditSerialPath"]!, "*.json").Take(Step).ToList();
                if (Batch.Count == 0) break;

                var ValidFilmIds = new HashSet<int>(_context.Films.Select(f => f.Id));

                foreach (var JsonFile in Batch)
                {
                    try
                    {
                        var Json = File.ReadAllText(JsonFile);
                        var Credit = JsonSerializer.Deserialize<CelebrityCredit>(Json);

                        if (Credit == null) continue;

                        if (!ValidFilmIds.Contains(Credit.FilmId))
                        {
                            continue;
                        }

                        _context.CelebrityCredits.Add(Credit);
                    }
                    catch
                    {
                        continue;
                    }
                }

                _context.SaveChanges();

                foreach (var JsonFile in Batch)
                    File.Delete(JsonFile);
            }
        }
    }
}
