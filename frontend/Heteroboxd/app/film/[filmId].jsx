import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Linking, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, RefreshControl } from 'react-native'
import { Snackbar } from 'react-native-paper'
import { Link, useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Author from '../../components/author'
import { Backdrop } from '../../components/backdrop'
import Divider from '../../components/divider'
import FilmDataLoaders from '../../components/filmDataLoaders'
import FilmInteract from '../../components/filmInteract'
import { Headshot } from '../../components/headshot'
import Histogram from '../../components/histogram'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import ParsedRead from '../../components/parsedRead'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import Stars from '../../components/stars'
import { UserAvatar } from '../../components/userAvatar'
import Heart from '../../assets/icons/heart.svg'

const TOP_COUNT = 5

const Film = () => {
  const { filmId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ film, setFilm ] = useState({ id: null, title: '', originalTitle: '', country: [], genres: [], tagline: '', synopsis: '', posterUrl: '', backdropUrl: '', length: 0, releaseYear: 0, watchCount: 0, collection: {}, castAndCrew: [] })
  const [ uwf, setUwf ] = useState(null)
  const [ usersReview, setUsersReview ] = useState(null)
  const [ topReviews, setTopReviews ] = useState([])
  const [ reviewCount, setReviewCount ] = useState(0)
  const [ ratings, setRatings ] = useState({})
  const [ watchlisted, setWatchlisted ] = useState(false)
  const [ listsCount, setListsCount ] = useState(0)
  const [ friends, setFriends ] = useState(null)
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [ snack, setSnack ] = useState(false)
  const snackRef = useRef(false)
  const [ server, setServer ] = useState(Response.initial)
  const [ isRefreshing, setIsRefreshing ] = useState(false)

  const loadBasicData = useCallback(async (fromRefresh = false) => {
    setServer(Response.loading)
    try {
      if (fromRefresh) setIsRefreshing(false)
      const res = await fetch(`${BaseUrl.api}/films?FilmId=${filmId}`)
      if (res.ok) {
        const json = await res.json()
        setFilm({
          id: json.film.id, title: json.film.title, originalTitle: json.film.originalTitle, country: format.parseCountry(json.film.country, Platform.OS),
          genres: json.film.genres, tagline: json.film.tagline, synopsis: json.film.synopsis, posterUrl: json.film.posterUrl, backdropUrl: json.film.backdropUrl,
          length: json.film.length, releaseYear: format.parseOutYear(json.film.date), watchCount: json.film.watchCount, collection: json.film.collection, castAndCrew: json.film.castAndCrew
        })
        setRatings(json.ratings)
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [filmId])
  
  const loadUserData = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      console.log('anonymous browsing; not loading user data.')
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/interactions/${filmId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        if (json.uwf?.date && json.uwf?.timesWatched) {
          setUwf({ dateWatched: `Last watched on ${format.parseDate(json.uwf.date)}`, timesWatched: json.uwf.timesWatched })
        }
        if (json.watchlisted) {
          setWatchlisted(json.watchlisted)
        }
        if (json.review?.id?.length > 0) {
          setUsersReview(json.review)
        }
        if (json.friends) {
          setFriends(json.friends)
        }
      } else {
        console.log('internal server error in loadUserData; debugging...')
      }
    } catch {
      console.log('network error in loadUserData; handled above.')
    }
  }, [filmId, user])

  const loadSubsequentData = useCallback(async () => {
    try {
      const res = await fetch(`${BaseUrl.api}/films/subsequent?FilmId=${filmId}&PageSize=${TOP_COUNT}`)
      if (res.ok) {
        const json = await res.json()
        setListsCount(json.lists)
        setTopReviews(json.reviews.items)
        setReviewCount(json.reviews.totalCount)
      } else {
        console.log('internal server error in loadSubsequentData; debugging...')
      }
    } catch {
      console.log('network error in loadSubsequentData; handled above.')
    }
  }, [filmId])

  useEffect(() => {
    loadBasicData()
    loadUserData()
    loadSubsequentData()
  }, [loadBasicData, loadUserData, loadSubsequentData])

  useEffect(() => {
    navigation.setOptions({
      headerShown: Platform.OS === 'web' ? false : true,
      headerTransparent: true,
      headerBackground: () => null,
      headerTitle: '',
      headerStyle: {backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0}
    })
  }, [navigation])

  useEffect(() => {
    if (!user || !uwf) return
    if (snackRef.current) return
    snackRef.current = true
    setSnack(true)
  }, [user, uwf])

  useEffect(() => {
    snackRef.current = false
    setSnack(false)
  }, [filmId])
  
  const widescreen = useMemo(() => width > 1000, [width])
  const actors = useMemo(() => film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'actor').sort((a, b) => a.order - b.order) ?? [], [film.castAndCrew])
  const directors = useMemo(() => film.castAndCrew?.filter(credit => credit.role.toLowerCase() === 'director' && credit.name && credit.id) ?? [], [film.castAndCrew])
  const crew = useMemo(() => film.castAndCrew?.filter(credit => !['actor', 'director'].includes(credit.role.toLowerCase())) ?? [], [film.castAndCrew])
  const posterWidth = useMemo(() => Math.min(width * 0.3, 225), [width])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4.1, [maxRowWidth, spacing])
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth])
  const headshotSize = useMemo(() => widescreen ? 100 : 72, [widescreen])
  const expansionScaling = useMemo(() => widescreen ? 30 : 20, [widescreen])
  const friendSize = useMemo(() => headshotSize*0.75, [headshotSize])
  const backdrop = useMemo(() => <Backdrop backdropUrl={film.backdropUrl} />, [film.backdropUrl])

  if (server.result <= 0) {
    return (
      <>
      <Head>
        <title>Film</title>
        <meta name="description" content="Film page - poster, title, synopsis, average rating, cast & crew, etc." />
        <meta property="og:title" content="Film" />
        <meta property="og:description" content="Film page - poster, title, synopsis, average rating, cast & crew, etc." />
      </Head>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
      </>
    )
  }

  return (
    <>
    <Head>
      <title>{film.title}</title>
      <meta name="description" content={film.synopsis} />
      <meta property="og:title" content={film.title} />
      <meta property="og:description" content={film.synopsis} />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50, overflow: 'hidden'}}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 0,
          width: widescreen ? 1000 : width,
          alignSelf: 'center'
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setIsRefreshing(true)
              loadBasicData(true)
              loadUserData()
              loadSubsequentData()
            }}
          />
        }
      >
        {backdrop}

        <View style={{width: '100%', marginTop: -15, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', alignSelf: 'center'}}>
          <View style={{flex: 1, justifyContent: 'space-around', height: posterHeight}}>
            <View>
              <HText style={{fontWeight: '700', color: Colors.text_title, textAlign: 'left', fontSize: widescreen ? 50 : 28, lineHeight: widescreen ? 55 : 33, paddingHorizontal: 1 }}>{film.title}</HText>
              { film.originalTitle && <HText style={[styles.text, { fontSize: widescreen ? 25 : 14 }]}>{film.originalTitle}</HText> }
            </View>
            <View>
              <HText style={[styles.subtitle, { fontSize: widescreen ? 20 : 14 }]}>DIRECTED BY</HText>
              <HText style={[styles.link, { fontSize: widescreen ? 20 : 14 }]}>
                {directors.map((director, index) => (
                  <React.Fragment key={director.id}>
                    <Link href={`/celebrity/${director.id}?t=directed`} style={[styles.link, { fontSize: widescreen ? 20 : 14 }]}>
                      {director.name}
                    </Link>
                    {index < directors.length - 1 && <HText>, </HText>}
                  </React.Fragment>
                ))}
                {directors.length === 0 && <HText style={{fontWeight: '300', color: Colors.text}}>no one, apparently?</HText>}
              </HText>
            </View>
            
            <View style={{flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'}}>
              <HText style={[styles.text, {fontSize: widescreen ? 20 : 14}]}>
                {film.releaseYear}
                {film.length > 0 && ` • ${film.length} min`}
                {film.country?.length > 0 && ' • '}
              </HText>
              {film.country?.map((c, i) =>
                Platform.OS === 'web' ? (
                  <img key={i} src={`https://flagcdn.com/24x18/${c}.png`} style={{ marginRight: 6, width: 20, height: 15 }} />
                ) : (
                  <HText key={i} style={[styles.text, {fontSize: widescreen ? 20 : 14}]}>{c} </HText>
                )
              )}
            </View>
          </View>
          <Pressable onPress={() => Linking.openURL(film.posterUrl)}>
            <Poster posterUrl={film.posterUrl || 'noposter'} style={{width: posterWidth, height: posterHeight, borderRadius: 5, borderWidth: 2, borderColor: Colors.border_color}} />
          </Pressable>
        </View>
        
        <Divider marginVertical={15} />
        
        <HText style={{fontWeight: '700', color: Colors.text, textAlign: 'left', paddingHorizontal: 10, fontSize: widescreen ? 20 : 16, marginBottom: film.tagline?.length === 0 ? 0 : widescreen ? 10 : 5}}>{film.tagline || ''}</HText>
        <HText style={[styles.text, {fontSize: widescreen ? 18 : 14, paddingHorizontal: 10}]}>{film.synopsis}</HText>

        {
          film.genres?.length > 0 &&
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: widescreen ? 15 : 10}}>
              {
                film.genres.map((genre, i) => (
                  <Pressable key={i} onPress={() => router.push(`films/explore?filter=genre&value=${genre}`)} style={[{backgroundColor: Colors.heteroboxd, padding: 5, borderRadius: 3}, (i !== film.genres.length - 1) && {marginRight: 10}]}>
                    <HText style={{color: Colors.text_button, fontSize: widescreen ? 16 : 12}}>{genre}</HText>
                  </Pressable>
                ))
              }
            </View>
          </>
        }

        <Divider marginVertical={15} />
        
        <HText style={[styles.regionalTitle, {marginBottom: 10, fontSize: widescreen ? 24 : 20}]}>Ratings</HText>
        {
          Object.entries(ratings).length > 0 ? (
            <Histogram histogram={ratings} />
          ) : (
            <HText style={{padding: widescreen ? 20 : 10, color: Colors.text, fontSize: widescreen ? 22 : 18, textAlign: 'center'}}>
              This film hasn't been rated yet.
            </HText>
          )
        }

        <Divider marginVertical={20} />
        
        {
          user ? (
            <FilmInteract widescreen={widescreen} filmId={film.id} seen={uwf} watchlisted={watchlisted} review={usersReview}/>
          ) : (
            <Link style={{color: Colors.text_link, fontSize: 16, paddingHorizontal: 10, textAlign: 'center'}} href='/login'>Create a Heteroboxd account or log in to interact with this film.</Link>
          )
        }

        <Divider marginVertical={20} />

        <FilmDataLoaders filmId={film.id} watchCount={film.watchCount || 0} reviewCount={reviewCount} listsIncluded={listsCount} widescreen={widescreen} router={router} />
        
        <Divider marginVertical={20} />

        <HText style={[styles.regionalTitle, {marginBottom: 10, fontSize: widescreen ? 24 : 20}]}>Cast</HText>
        {
          actors.length === 0 ? (
            <View style={{height: headshotSize, alignSelf: 'center', alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}>
              <HText style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>There's no recorded cast for this feature.</HText>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{width: Math.min(width * 0.95, 1000), alignSelf: 'center'}}
              contentContainerStyle={{alignItems: 'flex-start', justifyContent: 'flex-start'}}
              data={actors}
              keyExtractor={(item, index) => `${item.id}-${item.character}-${index}`}
              renderItem={({item}) => (
                <Pressable onPress={() => router.push(`/celebrity/${item.id}?t=starred`)} style={{marginRight: 15}}>
                  <View style={{width: headshotSize + expansionScaling, alignItems: 'center'}}>
                    <Headshot
                      pictureUrl={item.headshotUrl || null}
                      style={{
                        width: headshotSize,
                        height: headshotSize,
                        borderRadius: headshotSize / 2,
                        borderWidth: 1,
                        borderColor: Colors.border_color
                      }}
                    />
                    <HText style={[styles.subtitle, { textAlign: 'center', marginTop: 5, fontSize: widescreen ? 16 : 12 }]}>
                      {item.name}
                    </HText>
                    <HText style={[styles.text, { textAlign: 'center', fontSize: widescreen ? 15 : 11 }]}>
                      {item.character.replace('(uncredited)', '') || 'N/A'}
                    </HText>
                  </View>
                </Pressable>
              )}
            />
          )
        }

        <HText style={[styles.regionalTitle, {marginVertical: 10, fontSize: widescreen ? 24 : 20}]}>Crew</HText>
        {
          (directors.length === 0 && crew.length === 0) ? (
            <View style={{height: headshotSize, alignSelf: 'center', alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}>
              <HText style={[styles.text, {fontSize: widescreen ? 20 : 16}]}>There's no recorded crew for this feature.</HText>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{width: Math.min(width * 0.95, 1000), alignSelf: 'center'}}
              contentContainerStyle={{alignItems: 'flex-start', justifyContent: 'flex-start'}}
              data={[...directors, ...crew]}
              keyExtractor={(item, index) => `${item.id}-${item.role}-${index}`}
              renderItem={({item}) => (
                <Pressable onPress={() => router.push(`/celebrity/${item.id}${item.role.toLowerCase() === 'director' ? '?t=directed' : item.role.toLowerCase() === 'producer' ? '?t=produced' : item.role.toLowerCase() === 'writer' ? '?t=wrote' : item.role.toLowerCase() === 'composer' ? '?t=composed' : ''}`)} style={{marginRight: 15}}>
                  <View style={{ width: headshotSize + expansionScaling, alignItems: "center", }}>
                    <Headshot
                      pictureUrl={item.headshotUrl}
                      style={{
                        width: headshotSize,
                        height: headshotSize,
                        borderRadius: headshotSize / 2,
                        borderWidth: 2,
                        borderColor: Colors.border_color
                      }}
                    />
                    <HText style={[styles.subtitle, {textAlign: 'center', marginTop: 5, fontSize: widescreen ? 16 : 12}]}>
                      {item.name}
                    </HText>
                    <HText style={[styles.text, {textAlign: 'center', fontSize: widescreen ? 15 : 11 }]}>
                      {`(${item.role})`}
                    </HText>
                  </View>
                </Pressable>
              )}
            />
          )
        }

        {
          friends?.length > 0 && (
            <>
              <Divider marginVertical={20} />

              <HText style={[styles.regionalTitle, {marginBottom: 10, fontSize: widescreen ? 24 : 20}]}>Also watched by...</HText>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={widescreen}
                style={{ width: Math.min(width * 0.95, 1000), alignSelf: 'center' }}
                contentContainerStyle={{alignItems: 'flex-start', justifyContent: 'flex-start'}}
                data={friends}
                keyExtractor={(item, index) => `${item.friendId}-${index}`}
                renderItem={({item}) => (
                  <Pressable onPress={() => item.reviewId ? router.push(`/review/${item.reviewId}`) : router.push(`/profile/${item.friendId}`)} style={{marginRight: 15}}>
                    <View style={{width: headshotSize + expansionScaling, alignItems: 'center'}}>
                      <UserAvatar
                        pictureUrl={item.friendPictureUrl}
                        style={{
                          width: friendSize,
                          height: friendSize,
                          borderRadius: friendSize/2,
                          borderWidth: 1,
                          borderColor: Colors.border_color
                        }}
                      />
                      {
                        item.rating && <Stars size={widescreen ? 18 : 12.5} rating={item.rating} readonly={true} padding={false} align={'center'} /> 
                      }
                    </View>
                  </Pressable>
                )}
              />
            </>
          )
        }

        <Divider marginVertical={20} />

        <HText style={[styles.regionalTitle, {marginBottom: 10, fontSize: widescreen ? 24 : 20}]}>Top Reviews</HText>
        {
          topReviews.length === 0 ? (
            <View style={{height: headshotSize, alignSelf: 'center', alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}>
              <HText style={[styles.text, {fontSize: widescreen ? 18 : 14, textAlign: 'center'}]}>There are no spoiler-free reviews for this film.</HText>
              <Link href={`/review/alter/${film.id}`} style={{fontSize: widescreen ? 18 : 14, color: Colors.text_link, textAlign: 'center'}}>Be the first to write one!</Link>
            </View>
          ) : (
            <>
              {topReviews.map((r) => {
                return (
                  <View
                    key={r.id}
                    style={{
                      backgroundColor: Colors.card,
                      width: '90%',
                      alignSelf: 'center',
                      paddingVertical: 5,
                      paddingHorizontal: 7.5,
                      marginBottom: 10,
                      borderRadius: 5,
                      borderTopWidth: 2,
                      borderBottomWidth: 2,
                      borderColor: Colors.border_color
                    }}>
                    <Author
                      userId={r.authorId}
                      url={r.authorPictureUrl || null}
                      username={format.sliceText(r.authorName || 'Anonymous', widescreen ? 50 : 25)}
                      admin={r.admin}
                      router={router}
                      widescreen={widescreen}
                      dim={widescreen ? 32 : 26}
                    />
                    <Pressable onPress={() => router.push(`/review/${r.id}`)}>
                      <Stars size={widescreen ? 30 : 22} readonly={true} padding={false} align={'flex-start'} rating={r.rating} />
                      <ParsedRead html={`${format.sliceText(r.text.replace(/\n{2,}/g, '\n').trim(), widescreen ? 250 : 150)}`} />
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 3}}>
                        <Heart width={widescreen ? 16 : 12} height={widescreen ? 16 : 12} fill={Colors.heteroboxd} />
                        <HText style={{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12}}>{format.formatCount(r.likeCount)}</HText>
                      </View>
                    </Pressable>
                  </View>
                )
              })}
              <Pressable onPress={() => router.push(`/reviews/film/${film.id}`)}>
                <HText style={{fontSize: widescreen ? 20 : 16, color: Colors.text_title, textAlign: 'center'}}>
                  <HText style={{fontWeight: 'bold'}}>SEE ALL ({format.formatCount(reviewCount)}) {'➜'}</HText>
                </HText>
              </Pressable>
            </>
          )
        }
        
        {film.collection && Object.keys(film.collection).length > 0 && (
          <>
            <Divider marginVertical={20} />
            <HText style={[styles.regionalTitle, {fontSize: widescreen ? 24 : 20}]}>Related Films</HText>
            <View style={{width: colPosterWidth * 4.1 + spacing * 4, maxWidth: '100%', alignSelf: 'center'}}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={widescreen}
                style={{maxWidth: Math.min(width * 0.95, 1000), paddingBottom: 10}}
                data={Object.entries(film.collection)}
                keyExtractor={([tmdbId], index) => `${tmdbId}-${index}`}
                renderItem={({ item: [tmdbId, posterLink], index }) => (
                  <Pressable onPress={() => router.push(`/film/${tmdbId}`)} style={{marginRight: index < Object.entries(film.collection).length - 1 ? spacing : 0}}>
                    <Poster
                      posterUrl={posterLink || 'noposter'}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: Colors.border_color
                      }}
                    />
                  </Pressable>
                )}
              />
            </View>
          </>
        )}

        <HText style={[styles.text, {marginTop: widescreen ? 250 : 100, textAlign: 'center', alignSelf: 'center', fontSize: widescreen ? 18 : 14}]}>
          This film's metadata was provided by <Link style={styles.link} href={`https://www.themoviedb.org/movie/${film.id}`}>tMDB</Link>, bearing no endorsement whatsoever.
        </HText>
      </ScrollView>

      <Popup
        visible={[404, 500].includes(server.result)}
        message={server.message}
        onClose={() => { server.result === 404 ? router.replace('/') : router.replace('/contact') }}
      />

      <Snackbar
        visible={snack}
        onDismiss={() => setSnack(false)}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? '50%' : '90%',
          alignSelf: 'center',
          borderRadius: 8
        }}
        action={{
          label: 'OK',
          onPress: () => setSnack(false),
          textColor: Colors.text_link,
        }}
      >
        {uwf?.dateWatched}
      </Snackbar>
    </View>
    </>
  )
}

export default Film

const styles = StyleSheet.create({
  text: {
    fontWeight: '350',
    color: Colors.text,
    textAlign: 'left',
  },
  link: {
    color: Colors.text_link,
    fontWeight: '700',
  },
  regionalTitle: {
    fontWeight: '500',
    marginBottom: 5,
    marginLeft: 12,
    color: Colors.text_title,
    textAlign: 'left',
  },
  subtitle: {
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'left',
  }
})