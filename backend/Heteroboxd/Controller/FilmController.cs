using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/films")]
    public class FilmController : ControllerBase
    {
        private readonly IFilmService _service;

        public FilmController(IFilmService service)
        {
            _service = service;
        }

        //GET endpoints -> public access

        [HttpGet]
        [Authorize(Policy = "RequireAdminTier")]
        public async Task<IActionResult> GetAllFilms()
        {
            //retrives all films from database
            try
            {
                var AllFilms = await _service.GetAllFilms();
                return Ok(AllFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        /*
        [HttpGet]
        [Authorize(Policy = "RequirePaidTier")]
        public async Task<IActionResult> ExploreFilms()
        {
            //retrives all films from database
            try
            {
                var AllFilms = await _service.GetAllFilms();
                return Ok(AllFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }
        */

        [HttpGet("trending")]
        public IActionResult GetTrendingFilms()
        {
            //retrives today's trending films from database
            //maybe a direct tMDB API call instead? only called once a day
            throw new NotImplementedException();
        }

        [HttpGet("film/{FilmId}")]
        public async Task<IActionResult> GetFilm(string FilmId)
        {
            //retrives specific film from database
            try
            {
                var Film = await _service.GetFilm(FilmId);
                return Film == null ? NotFound() : Ok(Film);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("year/{Year}")]
        public async Task<IActionResult> GetFilmsByYear(int Year)
        {
            //retrives all specific year's films from database
            try
            {
                var YearsFilms = await _service.GetFilmsByYear(Year);
                return Ok(YearsFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("celebrity/{CelebrityId}")]
        public async Task<IActionResult> GetFilmsByCelebrity(string CelebrityId)
        {
            //retrives all films for a specific celebrity from database
            try
            {
                var CelebritiesFilms = await _service.GetFilmsByCelebrity(CelebrityId);
                return Ok(CelebritiesFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("user/{UserId}")]
        public async Task<IActionResult> GetUsersWatchedFilms(string UserId)
        {
            //retrives all films a specific user has watched from database
            try
            {
                var UsersFilms = await _service.GetUsersWatchedFilms(UserId);
                return Ok(UsersFilms);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchFilms([FromQuery] FilmSearchRequest Search)
        {
            //retrieves films closely matching (complex) search criteria from database
            try
            {
                var SearchResults = await _service.SearchFilms(Search);
                return Ok(SearchResults);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //POST endpoints -> not allowed, films added via tMDB sync only

        //PUT endpoints -> ADMIN privileges only

        [HttpPut]
        public async Task<IActionResult> UpdateFilm([FromBody] UpdateFilmRequest FilmRequest)
        {
            //updates an existing film in the database
            try
            {
                await _service.UpdateFilm(FilmRequest);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpPut("favorite-count/{FilmId}/{FavoriteChange}")]
        public async Task<IActionResult> UpdateFilmFavoriteCount(string FilmId, string FavoriteChange)
        {
            //increments/decriments film's favorite count in database
            try
            {
                await _service.UpdateFilmFavoriteCountEfCore7Async(FilmId, FavoriteChange);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentException)
            {
                return BadRequest();
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //DELETE endpoints -> ADMIN privileges only

        [HttpDelete("{FilmId}")]
        public async Task<IActionResult> DeleteFilm(string FilmId)
        {
            //deletes a film from the database
            try
            {
                await _service.LogicalDeleteFilm(FilmId);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch
            {
                return StatusCode(500);
            }
        }
    }
}