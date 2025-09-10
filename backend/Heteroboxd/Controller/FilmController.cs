using Heteroboxd.Models.DTO;
using Microsoft.AspNetCore.Authorization;
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
            return null;
        }

        [HttpGet("trending")]
        public IActionResult GetTrendingFilms()
        {
            //retrives today's trending films from database
            //maybe a direct tMDB API call instead? only called once a day
            return null;
        }

        [HttpGet("film/{FilmId}")]
        public IActionResult GetFilm(string FilmId)
        {
            //retrives specific film from database
            return null;
        }

        [HttpGet("year/{Year}")]
        public IActionResult GetFilmsByYear(int Year)
        {
            //retrives all specific year's films from database
            return null;
        }

        [HttpGet("celebrity/{CelebrityId}")]
        public IActionResult GetFilmsByCelebrity(string CelebrityId)
        {
            //retrives all films for a specific celebrity from database
            //accesses CelebrityCredit join table through Celebrity, consider separating into a new controller
            return null;
        }

        [HttpGet("user/{UserId}")]
        public IActionResult GetUsersWatchedFilms(string UserId)
        {
            //retrives all films a specific user has watched from database
            //accesses UserWatchedFilm join table through User, consider separating into a new controller
            return null;
        }

        [HttpGet("search")]
        public IActionResult SearchFilms([FromQuery] FilmSearchRequest Search)
        {
            //retrieves films closely matching (complex) search criteria from database
            return null;
        }

        //POST endpoints -> depricated

        [HttpPost]
        public IActionResult AddFilm([FromBody] CreateFilmRequest FilmRequest)
        {
            //adds a new film to the database
            return null;
        }

        //PUT endpoints -> ADMIN privileges only

        [HttpPut]
        public IActionResult UpdateFilm([FromBody] UpdateFilmRequest FilmRequest)
        {
            //updates an existing film in the database
            return null;
        }

        [HttpPut("favorite-count/{FilmId}/{FavoriteChange}")]
        public IActionResult UpdateFilmFavoriteCount(string FilmId, string FavoriteChange)
        {
            //FavoriteChange should be +1 or -1, convert to numeral
            //called when a user favorites/unfavorites a film
            return null;
        }

        //DELETE endpoints -> ADMIN privileges only

        [HttpDelete("{FilmId}")]
        public IActionResult DeleteFilm(string FilmId)
        {
            //deletes a film from the database
            return null;
        }
    }
}