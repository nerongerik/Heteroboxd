using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("films")]
    public class FilmController : ControllerBase
    {
        //GET endpoints -> public access

        [HttpGet]
        public IActionResult GetAllFilms()
        {
            //retrives all films from database
            //consider pagination, sorting, filtering
        }

        [HttpGet("trending")]
        public IActionResult GetTrendingFilms()
        {
            //retrives today's trending films from database
            //maybe a direct tMDB API call instead? only called once a day
        }

        [HttpGet("film/{FilmId}")]
        public IActionResult GetFilm(string FilmId)
        {
            //retrives specific film from database

        }

        [HttpGet("year/{Year}")]
        public IActionResult GetFilmsByYear(int Year)
        {
            //retrives all specific year's films from database
        }

        [HttpGet("search")]
        public IActionResult SearchFilms([FromQuery] FilmSearchRequest Search)
        {
            //retrieves films closely matching (complex) search criteria from database
        }

        //POST endpoints -> likely unused, films added via big tMDB API calls every once in a while; ADMIN privileges only

        [HttpPost]
        public IActionResult AddFilm([FromBody] CreateFilmRequest FilmRequest)
        {
            //adds a new film to the database
        }

        //PUT endpoints

        [HttpPut("{FilmId}")]
        public IActionResult UpdateFilm(string FilmId, [FromBody] UpdateFilmRequest FilmRequest)
        {
            //updates an existing film in the database
        }

        [HttpPut("favorite-count/{FilmId}")]
        public IActionResult UpdateFilmFavoriteCount(string FilmId, [FromBody] int FavoriteChange)
        {
            //increments/decrements a film's favorite count in the database
            //called when a user favorites/unfavorites a film
        }

        //DELETE endpoints -> likely unused, films deleted via big tMDB API calls every once in a while; ADMIN privileges only

        [HttpDelete("{FilmId}")]
        public IActionResult DeleteFilm(string FilmId)
        {
            //deletes a film from the database
        }
    }
