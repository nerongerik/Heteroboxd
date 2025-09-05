using Microsoft.AspNetCore.Mvc;
using Heteroboxd.Models.DTO;

namespace Heteroboxd.Controller
{
    [ApiController]
    [Route("celebrities")]
    public class CelebrityController
    {
        //GET endpoints -> limited public access

        [HttpGet]
        public IActionResult GetAllCelebrities()
        {
            //retrives all celebrities from database
            //probably useless; consider pagination, sorting, filtering
            return null;
        }

        [HttpGet("{CelebrityId}")]
        public IActionResult GetCelebrity(string CelebrityId)
        {
            //retrives specific celebrity from database
            return null;
        }

        [HttpGet("cast-and-crew/{FilmId}")]
        public IActionResult GetCelebritiesByFilm(string FilmId)
        {
            //retrives all celebrities for a specific film from database
            //uses CelebrityCredit join table, consider separating into a new controller
            return null;
        }

        [HttpGet("search")]
        public IActionResult SearchCelebrities([FromQuery] CelebritySearchRequest Search)
        {
            //retrieves celebrities closely matching (complex) search criteria from database
            //consider opting for a simple name search only
            return null;
        }

        //POST endpoints -> depricated

        [HttpPost]
        public IActionResult AddCelebrity([FromBody] CreateCelebrityRequest CelebrityRequest)
        {
            //adds a new celebrity to the database
            return null;
        }

        //PUT endpoints -> ADMIN privileges only

        [HttpPut]
        public IActionResult UpdateCelebrity([FromBody] UpdateCelebrityRequest CelebrityRequest)
        {
            //updates an existing celebrity in the database
            return null;
        }

        //DELETE endpoints -> ADMIN privileges only
        [HttpDelete("{CelebrityId}")]
        public IActionResult DeleteCelebrity(string CelebrityId)
        {
            //deletes a celebrity from the database
            //consider soft delete instead
            return null;
        }
    }
}
