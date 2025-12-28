export const compareFilms = ({ sortBy, direction }) => (a, b) => {
  const dir = direction === "desc" ? -1 : 1;

  //primary - by chosen criteria
  if (sortBy === "watchCount") {
    const diff = (a.watchCount ?? 0) - (b.watchCount ?? 0);
    if (diff !== 0) return diff * dir;
  }

  if (sortBy === "releaseYear") {}

  if (sortBy === "runtime") {}

  //secondary - always releaseYear
  const dateDiff =
    a.releaseYear -
    b.releaseYear;
  if (dateDiff !== 0) return dateDiff;

  //tie-breaker - string comparison
  return String(a.filmId).localeCompare(String(b.filmId));
};
