import { StyleSheet, Text, View, ScrollView, RefreshControl, useWindowDimensions, Platform, Pressable } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useMemo, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';
import * as auth from '../../helpers/auth';
import Popup from '../../components/popup';
import { Poster } from '../../components/poster';
import { Backdrop } from '../../components/backdrop';
import React from 'react';
import { Headshot } from '../../components/headshot';
import FilmInteract from '../../components/filmInteract';
import FilmDataLoaders from '../../components/filmDataLoaders';

const Film = () => {
  const { user, isValidSession } = useAuth(); //logged in user
  const [film, setFilm] = useState(null); //basic film data
  const [uwf, setUwf] = useState(null); //user-related film data -> null if !user
  const [usersReview, setUsersReview] = useState(null);

  const [watchlisted, setWatchlisted] = useState(null);

  const [listsCount, setListsCount] = useState(0);

  const { navprop } = useLocalSearchParams(); //navigational property
  const router = useRouter();
  const {width} = useWindowDimensions();

  const [refreshing, setRefreshing] = useState(false);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const loadFilmPage = async () => {
    setRefreshing(true);
    try {
      const vS = await isValidSession();
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
            collection: json.collection, castAndCrew: json.castAndCrew, reviewCount: json.reviewCount
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
        if (user && vS) {
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
              dateWatched: parseDate(json2.dateWatched), timesWatched: Number(json2.timesWatched)
            });
            //fetch users review if it exists
            const rewRes = await fetch(`${BaseUrl.api}/reviews/${user?.userId}/${Number(navprop)}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwt}`
              }
            });
            if (rewRes.status === 200) {
              const json3 = await rewRes.json();
              setUsersReview(json3);
            } else {
              console.log('User never reviewed this film before.');
            }
          } else if (uwfRes.status === 404) {
            console.log("User has never seen this film before.");
            setUwf(null);
          } else {
            setMessage("Something went wrong! Contact Heteroboxd support for more information!");
            setResult(500);
            setUwf(null);
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
            collection: json.collection, castAndCrew: json.castAndCrew, reviewCount: json.reviewCount
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
        if (user && vS) {
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
              dateWatched: parseDate(json2.dateWatched), timesWatched: Number(json2.timesWatched)
            });
            //fetch users review if it exists
            const rewRes = await fetch(`${BaseUrl.api}/reviews/${user?.userId}/${Number(navprop)}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwt}`
              }
            });
            if (rewRes.status === 200) {
              const json3 = await rewRes.json();
              setUsersReview(json3);
            } else {
              console.log('User never reviewed this film before.');
            }
          } else if (uwfRes.status === 404) {
            console.log("User has never seen this film before.");
            setUwf(null);
          } else {
            setMessage("Something went wrong! Contact Heteroboxd support for more information!");
            setResult(500);
            setUwf(null);
          }
        } else {
          setUwf(null);
        }
      }
    } catch {
      setMessage("Network error - Please check your internet connection!");
      setResult(500);
    }
    setRefreshing(false);
  }

  useEffect(() => { //handles data loading
    loadFilmPage();
  }, [navprop]);

  useEffect(() => { //checks if user previously watchlisted this film
    (async () => {
      const vS = await isValidSession();
      if (user && film && vS) {
        const jwt = await auth.getJwt();
        const wlRes = await fetch(`${BaseUrl.api}/users/${user.userId}/watchlist/${film.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwt}`,
          }
        });
        if (wlRes.status === 200) {
          const json = await wlRes.json();
          setWatchlisted(json);
        } else {
          setWatchlisted(false); //fallback
        }
      }
    })();
  }, [film, user]);

  useEffect(() => {
    if (!film) return;
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/lists/featuring-film/${film?.id}/count`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (res.status === 200) {
          const json = await res.json();
          setListsCount(json);
        } else {
          console.log(`${res.status}: Failed to fetch featuring lists count.`);
        }
      } catch {
        console.log(`${res.status}: Possible network error; probably failed earlier.`);
      }
    })();
  }, [film]);

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

  function parseCountry(country) {
    if (!country || country.length === 0) return null;
    return Object.keys(country).map(c => {
      const code = country[c]?.toUpperCase() ?? null;
      if (!code || code === "XX") return null;
      if (Platform.OS === "web") {
        return code.toLowerCase();
      }
      return code.replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
    });
  }
  
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);

  //credits parsing
  const actors = useMemo(() => film?.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'actor').sort((a, b) => a.order - b.order) ?? [], [film]);
  const directors = useMemo(() => film?.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'director' && credit.celebrityName && credit.celebrityId) ?? [], [film]);
  const crew = useMemo(() => film?.castAndCrew?.filter(credit => !['actor', 'director'].includes(credit.role.toLowerCase())) ?? [], [film]);
  //poster sizing
  const posterWidth = useMemo(() => Math.min(width * 0.3, 225), [width]);
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth]); //maintain 2:3 aspect
  //collection sizing
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]); //minimum spacing between posters
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width]); //determines max usable row width:
  //compute poster width
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing]);
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth]); //maintain 2:3 aspect
  //compute picture dimensions
  const headshotSize = useMemo(() => widescreen ? 100 : 72, [widescreen]);
  const expansionScaling = useMemo(() => widescreen ? 20 : 12, [widescreen]);
  //cache backdrop
  const MemoBackdrop = useMemo(() => <Backdrop backdropUrl={film?.backdropUrl} />, [film?.backdropUrl])

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

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadFilmPage} />
        }
        contentContainerStyle={{
          padding: 5,
          paddingTop: 0,
          minWidth: widescreen ? 1000 : 'auto',
          maxWidth: widescreen ? 1000 : "100%",
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {MemoBackdrop}

        <View style={[styles.row, {width: widescreen ? 1000 : "100%"}]}>
          <View style={{flex: 1, justifyContent: 'space-around', height: posterHeight}}>
            <View>
              <Text style={[styles.title, { fontSize: widescreen ? 50 : 28, lineHeight: widescreen ? 55 : 33, paddingHorizontal: 1 }]}>{film.title}</Text>
              {
                film.originalTitle && film.originalTitle !== film.title
                  ? (<Text style={[styles.text, { fontSize: widescreen ? 25 : 14 }]}>{film.originalTitle}</Text>)
                  : null
              }
            </View>
            <View>
              <Text style={[styles.subtitle, { fontSize: widescreen ? 20 : 14 }]}>DIRECTED BY</Text>
              {directors.map((director, index) => (
                <React.Fragment key={director.celebrityId}>
                  <Link
                    href={`/celebrity/${director.celebrityId}`}
                    style={[styles.link, { fontSize: widescreen ? 20 : 14 }]}
                  >
                    {director.celebrityName}
                  </Link>
                  {index < directors.length - 1 && ', '}
                </React.Fragment>
              ))}
            </View>
            
            <Text style={[styles.text, { fontSize: widescreen ? 20 : 14 }]}>
              {film.releaseYear} • {film.length} min {film?.country?.length > 0 && " • "}
              {film?.country?.map((c, i) =>
                Platform.OS === "web" ? (
                  <img key={i} src={`https://flagcdn.com/24x18/${c}.png`} style={{ marginRight: 6, width: 20, height: 15 }} />
                ) : (
                  <Text key={i}>{c} </Text>
                )
              )}
            </Text>

          </View>
          <Poster posterUrl={film.posterUrl} style={{ width: posterWidth, height: posterHeight, borderRadius: 5, borderWidth: 2, borderColor: Colors.border_color }} />
        </View>

        <View style={[styles.divider, {marginVertical: 15}]} />
        
        <Text style={[styles.tag, { fontSize: widescreen ? 20 : 16, marginBottom: 10 }]}>{film.tagline}</Text>
        <Text style={[styles.text, { fontSize: widescreen ? 18 : 14, paddingHorizontal: 10 }]}>{film.synopsis}</Text>
        
        <View style={[styles.divider, {marginTop: 15, marginBottom: film?.genres && film?.genres.length > 0 ? 10 : 15}]} />

        { film?.genres && film?.genres.length > 0 && (
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', alignSelf: 'center'}}>
              {
                film.genres.map((genre, i) => (
                  <Pressable key={i} onPress={() => router.push(`films/explore?type=genre&subtype=${genre}`)} style={[{backgroundColor: Colors.button, padding: 5, borderRadius: 3}, (i !== film.genres.length - 1) && {marginRight: 10}]}>
                    <Text style={{color: Colors.text_button, fontSize: widescreen ? 16 : 12}}>{genre}</Text>
                  </Pressable>
                ))
              }
            </View>
            <View style={[styles.divider, {marginTop: 10, marginBottom: 15}]} />
          </>
        )}

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[RATINGS GRAPH PLACEHOLDER]</Text>

        <View style={styles.divider}></View>
        
        {
          user && (
            <FilmInteract widescreen={widescreen} filmId={film?.id} seen={uwf?.timesWatched > 0} watchlisted={watchlisted} review={usersReview}/>
          )
        }

        <View style={styles.divider}></View>

        <FilmDataLoaders filmId={film?.id} watchCount={film?.watchCount ?? 0} reviewCount={film?.reviewCount} listsIncluded={listsCount} widescreen={widescreen} />

        <View style={styles.divider}></View>

        <Text style={[styles.regionalTitle, { marginBottom: 10 }]}>Cast</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={widescreen} //browsers with touchscreen SHOULD natively support scrolling
          style={{ maxWidth: Math.min(width * 0.95, 1000), alignSelf: "center", paddingBottom: 10 }}
        >
          {actors.length === 0 && (
            <View style={{height: headshotSize, alignSelf: 'center', alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}>
              <Text style={[styles.text, {fontSize: 20}]}>There's no recorded cast for this feature.</Text>
            </View>
          )}
          {actors.map((actor, index) => {
            return (
              <Pressable
                key={actor.celebrityId}
                onPress={() => router.push(`/celebrity/${actor.celebrityId}`)}
                style={{ marginRight: index < actors.length - 1 ? 15 : 0 }}
              >
                <View style={{ width: headshotSize + expansionScaling, alignItems: "center", }}>
                  <Headshot
                    pictureUrl={actor.celebrityPictureUrl}
                    style={{
                      width: headshotSize,
                      height: headshotSize,
                      borderRadius: headshotSize / 2,
                      borderWidth: 2,
                      borderColor: Colors.border_color
                    }}
                  />
                  <Text style={[styles.subtitle, { textAlign: "center", marginTop: 5, fontSize: widescreen ? 15 : 11 }]} numberOfLines={1}>
                    {actor.celebrityName}
                  </Text>
                  <Text style={[styles.text, { textAlign: "center", fontSize: widescreen ? 15 : 10 }, ]} numberOfLines={1}>
                    {`(${actor.character})`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.regionalTitle, { marginBottom: 10 }]}>Crew</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={widescreen}
          style={{ maxWidth: Math.min(width * 0.95, 1000), alignSelf: "center", paddingBottom: 10 }}
        >
          {(directors.length === 0 && crew.length === 0) && (
            <View style={{height: headshotSize, alignSelf: 'center', alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}>
              <Text style={[styles.text, {fontSize: 20}]}>There's no recorded crew for this feature.</Text>
            </View>
          )}
          {directors.map((director, index) => {
            return (
              <Pressable
                key={director.celebrityId}
                onPress={() => router.push(`/celebrity/${director.celebrityId}`)}
                style={{ marginRight: 15 }}
              >
                <View style={{ width: headshotSize + expansionScaling, alignItems: "center", }}>
                  <Headshot
                    pictureUrl={director.celebrityPictureUrl}
                    style={{
                      width: headshotSize,
                      height: headshotSize,
                      borderRadius: headshotSize / 2,
                      borderWidth: 2,
                      borderColor: Colors.border_color
                    }}
                  />
                  <Text style={[styles.subtitle, { textAlign: "center", marginTop: 5, fontSize: widescreen ? 15 : 11 }]} numberOfLines={1}>
                    {director.celebrityName}
                  </Text>
                  <Text style={[styles.text, { textAlign: "center", fontSize: widescreen ? 15 : 10 }, ]} numberOfLines={1}>
                    {`(${director.role})`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {crew.map((crewer, index) => {
            return (
              <Pressable
                key={crewer.celebrityId}
                onPress={() => router.push(`/celebrity/${crewer.celebrityId}`)}
                style={{ marginRight: index < crew.length - 1 ? 15 : 0 }}
              >
                <View style={{ width: headshotSize + expansionScaling, alignItems: "center", }}>
                  <Headshot
                    pictureUrl={crewer.celebrityPictureUrl}
                    style={{
                      width: headshotSize,
                      height: headshotSize,
                      borderRadius: headshotSize / 2,
                      borderWidth: 2,
                      borderColor: Colors.border_color
                    }}
                  />
                  <Text style={[styles.subtitle, { textAlign: "center", marginTop: 5, fontSize: widescreen ? 15 : 11 }]} numberOfLines={1}>
                    {crewer.celebrityName}
                  </Text>
                  <Text style={[styles.text, { textAlign: "center", fontSize: widescreen ? 15 : 10 }, ]} numberOfLines={1}>
                    {`(${crewer.role})`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.divider}></View>

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center", textAlign: "center"}]}>[FRIENDS WHO'VE WATCHED PLACEHOLDER]</Text>

        <View style={styles.divider}></View>

        <Text style={[styles.text, {fontSize: 20, alignSelf: "center"}]}>[TOP 3 REVIEWS PLACEHOLDER]</Text>

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
                horizontal
                showsHorizontalScrollIndicator={widescreen}
                style={{ maxWidth: Math.min(width * 0.95, 1000), alignSelf: "center", paddingBottom: 10 }}
              >
                {Object.entries(film?.collection).map(([tmdbId, posterLink], index) => (
                  <Pressable
                    key={tmdbId}
                    onPress={() => router.push(`/film/${tmdbId}`)}
                    style={{ marginRight: index < Object.entries(film.collection).length - 1 ? spacing : 0 }}
                  >
                    <Poster
                      posterUrl={posterLink}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: Colors.border_color
                      }}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <Text style={[styles.text, {marginTop: 50, textAlign: 'center', alignSelf: 'center', fontSize: widescreen ? 16 : 12}]}>
          The metadata for this film was provided by <Link style={styles.link} href={`https://www.themoviedb.org/movie/${film.id}`}>tMDB</Link>, bearing no endorsment of Heteroboxd whatsoever.
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