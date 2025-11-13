using Heteroboxd.Models.DTO;
using Heteroboxd.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("api/celebrities")]
    public class CelebrityController : ControllerBase
    {
        private readonly ICelebrityService _service;

        public CelebrityController(ICelebrityService service)
        {
            _service = service;
        }

        //GET endpoints -> limited public access

        [HttpGet]
        [Authorize(Policy = "RequireAdminTier")]
        public IActionResult GetAllCelebrities()
        {
            //retrives all celebrities from database
            try
            {
                var AllCelebrities = _service.GetAllCelebrities();
                return Ok(AllCelebrities);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("{CelebrityId}")]
        public IActionResult GetCelebrity(string CelebrityId)
        {
            //retrives specific celebrity from database
            try
            {
                var Celebrity = _service.GetCelebrityById(CelebrityId);
                return Ok(Celebrity);
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

        [HttpGet("cast-and-crew/{FilmId}")]
        public IActionResult GetCelebritiesByFilm(string FilmId)
        {
            //retrives all celebrity credits for a specific film from database
            try
            {
                var Celebrities = _service.GetCelebritiesByFilm(FilmId);
                return Ok(Celebrities);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        [HttpGet("search")]
        public IActionResult SearchCelebrities([FromQuery] string Search)
        {
            //search by name, possibly case-insensitive
            try
            {
                var Celebrities = _service.SearchCelebrities(Search);
                return Ok(Celebrities);
            }
            catch
            {
                return StatusCode(500);
            }
        }

        //POST endpoints -> depricated, celebrities added via tMDB sync only

        //PUT endpoints -> ADMIN privileges only

        [HttpPut]
        public IActionResult UpdateCelebrity([FromBody] UpdateCelebrityRequest CelebrityRequest)
        {
            //updates an existing celebrity in the database
            try
            {
                //_service.UpdateCelebrity(CelebrityRequest);
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

        //DELETE endpoints -> ADMIN privileges only
        [HttpDelete("{CelebrityId}")]
        public IActionResult DeleteCelebrity(string CelebrityId)
        {
            //logical delete, physical rarely or perhaps never
            try
            {
                _service.LogicalDeleteCelebrity(CelebrityId);
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
