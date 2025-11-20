import { StyleSheet, Text, View, ScrollView, RefreshControl, useWindowDimensions, Platform, TouchableOpacity } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';
import * as auth from '../../helpers/auth';
import Popup from '../../components/popup';
import {UserAvatar} from '../../components/userAvatar';
import {Countries} from '../../constants/countries';
import { Poster } from '../../components/poster';
import { Backdrop } from '../../components/backdrop';
import React from 'react';

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
  const scrollRef = React.useRef(null);

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

  React.useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = scrollRef.current;

    if (!node) return;

    // custom wheel handler
    const handleWheel = (e) => {
      e.preventDefault(); // NOW this works
      node.scrollLeft += e.deltaY;
    };

    // attach non-passive listener
    node.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      node.removeEventListener("wheel", handleWheel);
    };
  }, []);

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
  const actors = film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'actor') ?? [];
  const directors = film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'director' && credit.celebrityName && credit.celebrityId) ?? [];
  const writers = film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'writer') ?? [];
  const producers = film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'producer') ?? [];
  const composers = film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'composer') ?? [];
  //poster computation
  //minimum spacing between posters
  const posterWidth = Math.min(width * 0.33, 250);
  const posterHeight = posterWidth * (3 / 2); //maintain 2:3 aspect
  //collection sizing
  const spacing = Platform.OS === 'web' && width > 1000 ? 50 : 5; //minimum spacing between posters
  const maxRowWidth = (Platform.OS === 'web' && width > 1000 ? 1000 : width * 0.95); //determines max usable row width:
  //compute poster width:
  const colPosterWidth = (maxRowWidth - spacing * 4) / 4;
  const colPosterHeight = colPosterWidth * (3 / 2); //maintain 2:3 aspect

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

        <View style={[styles.row, {width: Platform.OS === "web" && width > 1000 ? 1000 : "100%"}]}>
          <View style={{flex: 1, justifyContent: 'space-around', height: posterHeight}}>
            <View>
              <Text style={[styles.title, { fontSize: Platform.OS === 'web' && width > 1000 ? 50 : 28, lineHeight: Platform.OS === 'web' && width > 1000 ? 55 : 33 }]}>{film.title}</Text>
              {
                film.originalTitle && film.originalTitle !== film.title
                  ? (<Text style={[styles.text, { fontSize: Platform.OS === 'web' && width > 1000 ? 25 : 14 }]}>{film.originalTitle}</Text>)
                  : null
              }
            </View>
            <View>
              <Text style={[styles.subtitle, { fontSize: Platform.OS === 'web' && width > 1000 ? 20 : 14 }]}>DIRECTED BY</Text>
              {directors.map((director, index) => (
                <React.Fragment key={director.celebrityId}>
                  <Link
                    href={`/celebrity/${director.celebrityId}`}
                    style={[styles.link, { fontSize: Platform.OS === 'web' && width > 1000 ? 20 : 14 }]}
                  >
                    {director.celebrityName}
                  </Link>
                  {index < directors.length - 1 && ', '}
                </React.Fragment>
              ))}
            </View>
            <Text style={[styles.text, { fontSize: Platform.OS === 'web' && width > 1000 ? 20 : 14 }]}>{film.releaseYear} • {film.length} min • X{/*{Countries[film.country]}*/}</Text>
          </View>
          <Poster posterUrl={film.posterUrl} style={{ width: posterWidth, height: posterHeight, borderRadius: 5, borderWidth: 2, borderColor: Colors.border_color }} />
        </View>

        <View style={styles.divider} />

        <Text style={[styles.tag, { fontSize: Platform.OS === 'web' && width > 1000 ? 20 : 18, marginBottom: 10, marginTop: 10 }]}>{film.tagline}</Text>
        <Text style={[styles.text, { fontSize: Platform.OS === 'web' && width > 1000 ? 18 : 16, paddingHorizontal: 10,  marginBottom: 10 }]}>{film.synopsis}</Text>
        
        <View style={styles.divider}></View>

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[RATINGS GRAPH PLACEHOLDER]</Text>

        <View style={styles.divider}></View>

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[CAST SCROLLER]</Text>
        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[CREW SCROLLER]</Text>

        <View style={styles.divider}></View>

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[FRIENDS WHO'VE WATCHED PLACEHOLDER]</Text>

        <View style={styles.divider}></View>

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[REVIEWS]</Text>

        <View style={styles.divider}></View>
        
        {film.collection && Object.keys(film.collection).length > 0 && (
          <>
            <Text style={styles.regionalTitle}>Related Films</Text>
            <View 
              style={{
                width: colPosterWidth * 4 + spacing * 3,
                maxWidth: "100%",
                alignSelf: "center",
              }}
            >
              <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing,
                }}
              >
                {Object.entries(film.collection).map(([tmdbId, posterLink]) => (
                  <TouchableOpacity
                    key={tmdbId}
                    onPress={() => router.replace(`/film/${tmdbId}`)}
                  >
                    <Poster
                      posterUrl={posterLink}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 8,
                        borderWidth: film ? 0 : 1,
                        borderColor: film ? "transparent" : Colors.border_color,
                        opacity: film ? 1 : 0.4,
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <View style={styles.divider}></View>

        <Text style={[styles.text, {alignSelf: 'center', fontSize: 16}]}>
          The metadata for this film was provided by <Link style={styles.link} href={`https://www.themoviedb.org/movie/${film.id}`}>tMDB</Link> bearing no endorsment of Heteroboxd whatsoever.
        </Text>
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
    overflow: 'hidden',
  },
  row: {
    marginTop: -15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    alignSelf: 'center'
  },
  title: {
    fontWeight: "700",
    color: Colors.text_title,
    textAlign: "left"
  },
  subtitle: {
    fontWeight: '900',
    color: Colors.text,
    textAlign: "left",
  },
  regionalTitle: {
    fontWeight: "500",
    marginBottom: 5,
    marginLeft: 12,
    fontSize: 20,
    color: Colors.text_title,
    textAlign: "left",
  },
  text: {
    fontWeight: "350",
    color: Colors.text,
    textAlign: "left",
  },
  link: {
    color: Colors.text_link,
    fontWeight: "700",
  },
  tag: {
    fontWeight: '700',
    color: Colors.text,
    textAlign: "left",
    paddingHorizontal: 10,
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
})