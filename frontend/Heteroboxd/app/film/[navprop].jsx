import { StyleSheet, Text, View, ScrollView, RefreshControl, useWindowDimensions, Platform } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';
import * as auth from '../../helpers/auth';
import Popup from '../../components/popup';
import {UserAvatar} from '../../components/userAvatar';
import {Countries} from '../../constants/countries';
import { Poster } from '../../components/poster';
import { Backdrop } from '../../components/backdrop';

const Film = () => {
  const { user, isValidSession } = useAuth(); //logged in user
  const [film, setFilm] = useState(null); //basic film data
  const [uwf, setUwf] = useState(null); //user-related film data -> null if !user

  /*

  IF USERWATCHEDFILM EXISTS, BUT WATCHCOUNT IS 0 (USER UNWATCHED A FILM), DISPLAY AS IF IT DOESN'T, BUT FETCH URL QUERY AS 'REWATCHED'

  */

  const { navprop } = useLocalSearchParams(); //navigational property
  const router = useRouter();
  const {width} = useWindowDimensions();

  const [refreshing, setRefreshing] = useState(false);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const loadFilmPage = async () => {
    setRefreshing(true);
    if (/^\d+$/.test(navprop)) {
      //fetch film
      const fRes = await fetch(`${BaseUrl.api}/films/${Number(navprop)}`, {
        method: "GET",
        headers: {'Accept': 'application/json'}
      });
      if (fRes.status === 200) {
        const json = await fRes.json();
        setFilm({
          id: json.filmId, title: json.title, originalTitle: json.originalTitle, country: parseCountry(json.country), genres: json.genres,
          tagline: json.tagline, synopsis: json.synopsis, posterUrl: json.posterUrl, backdropUrl: json.backdropUrl, length: json.length,
          releaseYear: json.releaseYear, slug: json.slug, favCount: json.favoriteCount, watchCount: json.watchCount,
          collection: json.collection, castAndCrew: json.castAndCrew
        });
        setResult(200);
      } else if (fRes.status === 404) {
        setMessage("This film no longer seems to exist.");
        setResult(404);
        setFilm({});
        setRefreshing(false);
        return;
      } else {
        setMessage("Something went wrong! Contact Heteroboxd support for more information!");
        setResult(500);
        setFilm({});
        setRefreshing(false);
        return;
      }
      //fetch uwf
      if (user && isValidSession()) {
        const jwt = await auth.getJwt();
        const uwfRes = await fetch(`${BaseUrl.api}/users/uwf/${user.userId}/${Number(navprop)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        });
        if (uwfRes.status === 200) { //user HAS watched film before
          const json2 = await uwfRes.json();
          setUwf({
            dateWatched: parseDate(json2.dateWatched), timesWatched: json2.timesWatched
          });
        } else if (uwfRes.status === 404) {
          console.log("User has never seen this film before.");
        } else {
          setMessage("Something went wrong! Contact Heteroboxd support for more information!");
          setResult(500);
        }
      } else {
        setUwf(null);
      }
    } else {
      //fetching by slug will ONLY be happening on browsers, meaning it's genuenly meaningful to make sure its the same film on refresh
      //but if a user manually enters url (id unknown) then it's ok to fetch by slug alone (it's not that deep)
      let json;
      const url = film ? `${BaseUrl.api}/films/slug/${navprop}?FilmId=${film.id}` : `${BaseUrl.api}/films/slug/${navprop}`;
      const fRes = await fetch(url, {
        method: "GET",
        headers: {'Accept': 'application/json'}
      });
      if (fRes.status === 200) {
        json = await fRes.json();
        setFilm({
          id: json.filmId, title: json.title, originalTitle: json.originalTitle, country: parseCountry(json.country), genres: json.genres,
          tagline: json.tagline, synopsis: json.synopsis, posterUrl: json.posterUrl, backdropUrl: json.backdropUrl, length: json.length,
          releaseYear: json.releaseYear, slug: json.slug, favCount: json.favoriteCount, watchCount: json.watchCount,
          collection: json.collection, castAndCrew: json.castAndCrew
        });
        setResult(200);
      } else if (fRes.status === 404) {
        setMessage("This film no longer seems to exist.");
        setResult(404);
        setFilm({});
        setRefreshing(false);
        return;
      } else {
        setMessage("Something went wrong! Contact Heteroboxd support for more information!");
        setResult(500);
        setFilm({});
        setRefreshing(false);
        return;
      }
      //fetch uwf
      if (user && isValidSession()) {
        const jwt = await auth.getJwt();
        const uwfRes = await fetch(`${BaseUrl.api}/users/uwf/${user.userId}/${Number(json.filmId)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        });
        if (uwfRes.status === 200) { //user HAS watched film before
          const json2 = await uwfRes.json();
          setUwf({
            dateWatched: parseDate(json2.dateWatched), timesWatched: json2.timesWatched
          });
        } else if (uwfRes.status === 404) {
          console.log("User has never seen this film before.");
        } else {
          setMessage("Something went wrong! Contact Heteroboxd support for more information!");
          setResult(500);
        }
      } else {
        setUwf(null);
      }
    }
    setRefreshing(false);
  }

  useEffect(() => { //handles data loading
    loadFilmPage();
  }, [navprop]);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web' && /^\d+$/.test(navprop) && film && film.slug && navprop !== film.slug) { //replace id for slug
        router.setParams({ navprop: film.slug });
      }
      //once we implement reviews, we might want to call for it and display user's rating differently from the usual "interact with this feature" view
    })();
  }, [film])

  function parseDate(date) {
    if (!date) return date;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nums = date.split(" ")[0].split("/");
    const day = nums[0]; const year = nums[2];
    const month = months[parseInt(nums[1] - 1)];
    return `last watched on ${month} ${day}, ${year}`;
  }

  const malformedCountries = ["kosovo", "serbia and montenegro", "yugoslavia"];

  function parseCountry(country) {
    if (!country) return country;
    return malformedCountries.includes(country.toLowerCase()) ? "Serbia" : country;
  }
  
  if (!film) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 5,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  //extract cast and crew for easier access
  const actors = film.castAndCrew.filter(credit => credit.role.toLowerCase() === 'actor');
  const directors = film.castAndCrew.filter(credit => credit.role.toLowerCase() === 'director' && credit.celebrityName && credit.celebrityId);
  const writers = film.castAndCrew.filter(credit => credit.role.toLowerCase() === 'writer');
  const producers = film.castAndCrew.filter(credit => credit.role.toLowerCase() === 'producer');
  const composers = film.castAndCrew.filter(credit => credit.role.toLowerCase() === 'composer');
  //poster computation
  //minimum spacing between posters
  const posterWidth = Math.min(width * 0.20, 300);
  const posterHeight = posterWidth * (3 / 2); //maintain 2:3 aspect

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadFilmPage} />
        }
        contentContainerStyle={{
          padding: 5,
          minWidth: Platform.OS === 'web' && width > 1000 ? 1000 : 'auto',
          maxWidth: Platform.OS === "web" && width > 1000 ? 1000 : "100%",
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        <Backdrop backdropUrl={film.backdropUrl} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'center', width: Platform.OS === "web" && width > 1000 ? 1000 : "100%" }}>
          <View>
            <Text>{film.title}</Text>
            {
              film.originalTitle && film.originalTitle !== film.title
                ? (<Text>{film.originalTitle}</Text>)
                : null
            }
            <Text>DIRECTED BY</Text>
            <Text>{directors.map(director => director.celebrityName).join(', ')}</Text>
            <Text>{film.releaseYear} • {film.length} min • X{/*{Countries[film.country]}*/}</Text>
          </View>
          <Poster posterUrl={film.posterUrl} style={{ width: posterWidth, height: posterHeight }} />
        </View>
        <Text>{film.tagline}</Text>
        <Text>{film.synopsis}</Text>
      </ScrollView>

      <Popup visible={result === 400 || result === 404 || result === 500} message={message} onClose={() => {
        result === 500 ? router.replace('/contact') : router.replace('/');
        }}
      />

    </View>
  )
}

export default Film

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
})