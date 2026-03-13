import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Snackbar } from 'react-native-paper'
import Checkbox from 'expo-checkbox'
import { Link, useRouter } from 'expo-router'
import * as auth from '../helpers/auth'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import Divider from './divider'
import HText from './htext'
import Stars from './stars'
import SlidingMenu from './slidingMenu'
import { UserAvatar } from './userAvatar'

const FilmInteract = ({ widescreen, filmId, seen, watchlisted, review }) => {
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const { width } = useWindowDimensions()
  const [ seenLocalCopy, setSeenLocalCopy ] = useState(null)
  const [ watchlistedLocalCopy, setWatchlistedLocalCopy ] = useState(null)
  const [ reviewLocalCopy, setReviewLocalCopy ] = useState({ id: null, rating: null, text: null, spoiler: null })
  const reviewLocalCopyRef = useRef(null)
  const [ seenPressed, setSeenPressed ] = useState(false)
  const ratingRequestRef = useRef(0)
  const { user, isValidSession } = useAuth()
  const [ server, setServer ] = useState(Response.initial)
  const [ listsClicked, setListsClicked ] = useState(false)
  const [ usersLists, setUsersLists ] = useState([])
  const router = useRouter()

  const openMenu = () => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(async () => {
      setMenuShown(false)
      setListsClicked(false)
    })
  }
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  })

  const handleRatingChange = useCallback(async (newRating) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const currentReview = reviewLocalCopyRef.current
    setSeenLocalCopy(true)
    setWatchlistedLocalCopy(false)
    setReviewLocalCopy({ id: currentReview?.id ?? null, rating: newRating, text: currentReview?.text ?? null, spoiler: currentReview?.spoiler ?? false })
    const requestId = ++ratingRequestRef.current
    try {
      const jwt = await auth.getJwt()
      let res
      if (currentReview?.id) {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
          body: JSON.stringify({
            ReviewId: currentReview.id,
            Rating: newRating,
            Text: currentReview.text || null,
            Spoiler: currentReview.spoiler ?? false
          })
        })
      } else {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
          body: JSON.stringify({
            Rating: newRating,
            Text: null,
            Spoiler: false,
            AuthorId: user.userId,
            FilmId: filmId
          })
        })
      }
      if (requestId !== ratingRequestRef.current) return
      if (res.ok) {
        const json = await res.json()
        setReviewLocalCopy(prev => ({ ...prev, id: json.id, rating: json.rating }))
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      if (requestId !== ratingRequestRef.current) return
      setServer(Response.networkError)
    }
  }, [user, ratingRequestRef, filmId])

  const handleWatch = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/track/${filmId}?Action=watched`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setSeenPressed(false)
        setSeenLocalCopy(true)
        setWatchlistedLocalCopy(false)
      } else if (res.status === 400) {
        setServer(Response.badRequest)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, filmId])

  const handleUnwatch = useCallback(async() => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/track/${filmId}?Action=unwatched`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setSeenPressed(false)
        setSeenLocalCopy(false)
        setReviewLocalCopy(null)
      } else if (res.status === 400) {
        setServer(Response.badRequest)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, filmId])

  const handleWatchlist = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/watchlist?FilmId=${filmId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setWatchlistedLocalCopy(prev => !prev)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, filmId])

  const fetchLists = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/film-interact?FilmId=${filmId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setUsersLists(json)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, filmId])

  const addToLists = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setListsClicked(false)
      setServer(Response.forbidden)
      return
    }
    try {
      const lists = usersLists.filter(item => item.selected).map(item => ({ key: item.listId, value: item.size }))
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          AuthorId: user.userId,
          FilmId: filmId,
          Lists: lists
        })
      })
      if (!res.ok) {
        setListsClicked(false)
        setServer(Response.internalServerError)
      }
      setListsClicked(false)
      setServer({ result: 201, message: 'Added successfully.' })
    } catch {
      setListsClicked(false)
      setServer(Response.internalServerError)
    }
  }, [user, usersLists, filmId])

  useEffect(() => {
    setWatchlistedLocalCopy(watchlisted)
    if (review) {
      setSeenLocalCopy(true)
      setReviewLocalCopy({ id: review.id, rating: review.rating, text: review.text, spoiler: review.spoiler })
    } else {
      setSeenLocalCopy(seen)
    }
  }, [seen, watchlisted, review])

  useEffect(() => {
    if (!review?.id) return
    setReviewLocalCopy(prev => {
      if (prev?.id === review.id) {
        return prev
      }
      return { id: review.id, rating: review.rating, text: review.text, spoiler: review.spoiler }
    })
  }, [review?.id])

  useEffect(() => {
    reviewLocalCopyRef.current = reviewLocalCopy
  }, [reviewLocalCopy])

  const button = 
    <View style={[styles.card, {minWidth: widescreen ? '50%' : '90%', maxWidth: widescreen ? '50%' : '90%', borderWidth: widescreen ? 0 : 2, borderColor: widescreen ? 'transparent' : Colors._heteroboxd}]}>
      <Pressable onPress={openMenu}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' }}>
          <UserAvatar pictureUrl={user?.pictureUrl || null} style={[styles.avatar, {width: widescreen ? 28 : 24, height: widescreen ? 28 : 24, borderRadius: widescreen ? 14 : 12}]} />
          <HText style={{color: Colors.text_button, fontSize: widescreen ? 16 : 13}}>
            {
              seenLocalCopy
                ? (reviewLocalCopy?.rating != null)
                  ? <Stars size={widescreen ? 16 : 13} rating={reviewLocalCopy.rating} readonly={true} padding={false} />
                  : "You have watched this film."
                : watchlistedLocalCopy
                  ? "This film is in your watchlist."
                  : "Watch, review, or add this film to your lists"
            }
          </HText>
          <MaterialIcons name="more-horiz" size={widescreen ? 24 : 20} color={Colors.text_button} />
        </View>
      </Pressable>
    </View>

  const watch = 
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatch}>
        <MaterialCommunityIcons name="eye-outline" size={widescreen ? 50 : 35} color={Colors.text} />
      </Pressable>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Watch</HText>
    </View>

  const watched =
    <View style={styles.buttonContainer}>
      <Pressable onPress={() => {setSeenPressed(true)}}>
        <MaterialCommunityIcons name="eye-check" size={widescreen ? 50 : 35} color={Colors._heteroboxd} />
      </Pressable>
      <HText style={{color: Colors._heteroboxd, fontSize: widescreen ? 20 : 18}}>Watched</HText>
    </View>

  const rewatch =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatch}>
        <MaterialCommunityIcons name="eye-refresh" size={widescreen ? 50 : 35} color={Colors.text} />
      </Pressable>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Rewatch</HText>
    </View>

  const unwatch =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleUnwatch}>
        <MaterialCommunityIcons name="eye-off" size={widescreen ? 50 : 35} color={Colors.heteroboxd} />
      </Pressable>
      <HText style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Remove</HText>
    </View>

  const watchlist =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatchlist}>
        <MaterialCommunityIcons name="bookmark-plus-outline" size={widescreen ? 50 : 35} color={Colors.text} />
      </Pressable>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Watchlist</HText>
    </View>

  const unwatchlist =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatchlist}>
        <MaterialCommunityIcons name="bookmark-remove" size={widescreen ? 50 : 35} color={Colors.heteroboxd} />
      </Pressable>
      <HText style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Watchlist</HText>
    </View>

  const selectLists =
    <>        
      {
        usersLists?.length > 0 ? (
          <ScrollView
            style={{ maxHeight: widescreen ? 500 : 250 }}
            showsVerticalScrollIndicator={false}
          >
            {usersLists.map((item) => (
              <View key={item.listId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 20 }}>
                <Checkbox
                  color={Colors.heteroboxd}
                  style={{width: widescreen ? 24 : 20, height: widescreen ? 24 : 20}}
                  disabled={item.containsFilm}
                  value={item.containsFilm || item.selected || false}
                  onValueChange={(checked) => {
                    setUsersLists(prev =>
                      prev.map(l =>
                        l.listId === item.listId ? { ...l, selected: checked } : l
                      )
                    );
                  }}
                />
                <HText style={{ marginLeft: 8, marginRight: 8, color: Colors.text, fontSize: widescreen ? 24 : 20 }}>{item.listName}</HText>
              </View>
            ))}
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15}}>
              <Pressable style={{marginRight: 20, backgroundColor: Colors.heteroboxd, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4}} onPress={() => setListsClicked(false)}>
                <HText style={{fontWeight: '500', fontSize: widescreen ? 22 : 18, color: Colors.text_title}}>Cancel</HText>
              </Pressable>
              <Pressable style={{backgroundColor: Colors._heteroboxd, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 2}} onPress={addToLists}>
                <HText style={{fontWeight: '500', fontSize: widescreen ? 22 : 18, color: Colors.text_title}}>Add</HText>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <HText style={{color: Colors.text_placeholder, textAlign: 'center', paddingHorizontal: 10, paddingBottom: 15, fontSize: 14}}>
            You have not created any lists. 
            <Link href="/list/create" style={{color: Colors.text_link}}> Create one now?</Link>
          </HText>
        )
      }
    </>

  return (
    <>
      {button}
      <SlidingMenu
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          {seenLocalCopy ? (seenPressed ? (<>{rewatch}{unwatch}</>) : (watched)) : (watch)}
          {watchlistedLocalCopy ? unwatchlist : watchlist}
        </View>
        <Divider marginVertical={20} />
        <Stars
          size={widescreen ? 60 : 50}
          rating={reviewLocalCopy?.rating ?? 0}
          onRatingChange={handleRatingChange}
          padding={true}
        />
        <HText style={{color: Colors.text, fontSize: 16, alignSelf: 'center'}}>Rate</HText>
        <Divider marginVertical={20} />
        <Pressable onPress={() => { closeMenu(); reviewLocalCopy?.id ? router.push(`/review/${reviewLocalCopy.id}`) : router.push(`/review/alter/${filmId}`) }}>
          <View style={{padding: 20, paddingTop: 0, paddingBottom: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
            <HText style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Review this film</HText>
            <MaterialCommunityIcons name="typewriter" size={24} color={Colors.text} />
          </View>
        </Pressable>
        <Divider marginVertical={20} />
        
        {listsClicked ? (
          selectLists
        ) : (
          <Pressable onPress={() => { fetchLists(); setListsClicked(true) }}>
            <View style={{padding: 20, paddingTop: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
              <HText style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Add to lists</HText>
              <MaterialCommunityIcons name="playlist-plus" size={28} color={Colors.text} />
            </View>
          </Pressable>
        )}

        <Snackbar
          visible={[201, 400, 403, 404, 500].includes(server.result)}
          onDismiss={() => setServer(Response.initial)}
          duration={3000}
          style={{
            backgroundColor: Colors.card,
            width: widescreen ? '50%' : '90%',
            alignSelf: 'center',
            borderRadius: 8,
          }}
          action={{
            label: 'OK',
            onPress: () => setServer(Response.initial),
            textColor: Colors.text_link
          }}
        >
          {server.message}
        </Snackbar>
      </SlidingMenu>
    </>
  )
}

export default FilmInteract

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 2,
    alignSelf: 'center',
    marginVertical: 10
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.border_color,
  },
  buttonContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15
  }
})