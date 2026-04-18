import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import More from '../assets/icons/more2.svg'
import Eye from '../assets/icons/eye.svg'
import EyeOff from '../assets/icons/eye-off2.svg'
import Watchlist from '../assets/icons/bookmark.svg'
import Rewatch from '../assets/icons/rewatch.svg'
import Watched from '../assets/icons/watched.svg'
import Edit from '../assets/icons/edit.svg'
import Addto from '../assets/icons/addto.svg'
import { Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
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
  const [ seenPressed, setSeenPressed ] = useState(false)
  const { user, isValidSession } = useAuth()
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()
  const reviewLocalCopyRef = useRef(null)
  const watchlistLocalCopyRef = useRef(null)
  const watchlistRequestRef = useRef(0)
  const ratingDebounceRef = useRef(null)
  const [ ratingPending, setRatingPending ] = useState(false)

  const translateY = slideAnim.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu = useCallback(() => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }, [slideAnim])
  const closeMenu = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const handleRatingChange = useCallback(async (newRating) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }

    setRatingPending(true)

    const currentReview = reviewLocalCopyRef.current
    setSeenLocalCopy(true)
    setWatchlistedLocalCopy(false)
    setReviewLocalCopy({ id: currentReview?.id || null, rating: newRating, text: currentReview?.text || null, spoiler: currentReview?.spoiler || false })

    if (ratingDebounceRef.current) clearTimeout(ratingDebounceRef.current)

    ratingDebounceRef.current = setTimeout(async () => {
      try {
        const jwt = await auth.getJwt()
        const reviewAtDispatch = reviewLocalCopyRef.current
        let res
        if (reviewAtDispatch?.id) {
          res = await fetch(`${BaseUrl.api}/reviews`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
            body: JSON.stringify({
              ReviewId: reviewAtDispatch.id,
              Rating: newRating,
              Text: reviewAtDispatch.text || null,
              Spoiler: reviewAtDispatch.spoiler || false
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
        if (res.ok) {
          const json = await res.json()
          setReviewLocalCopy(prev => ({ ...prev, id: json.id, rating: json.rating }))
        } else if (res.status === 400) {
          console.log('concurrency race condition')
        } else {
          setServer(Response.internalServerError)
        }
      } catch {
        setServer(Response.networkError)
      } finally {
        setRatingPending(false)
      }
    }, 1000)
  }, [user, filmId])

  const handleWatch = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setSeenPressed(false)
    setSeenLocalCopy(true)
    setWatchlistedLocalCopy(false)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/track/${filmId}?Action=watched`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) return
      if (res.status === 400) {
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
    setSeenPressed(false)
    setSeenLocalCopy(false)
    setReviewLocalCopy(null)
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/track/${filmId}?Action=unwatched`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) return
      if (res.status === 400) {
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
    const currentWl = watchlistLocalCopyRef.current
    setWatchlistedLocalCopy(!currentWl)
    const requestId = ++watchlistRequestRef.current
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/watchlist?FilmId=${filmId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (requestId !== watchlistRequestRef.current) return
      if (res.ok) return
      if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      if (requestId !== watchlistRequestRef.current) return
      setServer(Response.networkError)
    }
  }, [user, watchlistRequestRef, filmId])

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

  useEffect(() => {
    watchlistLocalCopyRef.current = watchlistedLocalCopy
  }, [watchlistedLocalCopy])

  const button = 
    <View style={[styles.card, {minWidth: widescreen ? '50%' : '90%', maxWidth: widescreen ? '50%' : '90%', borderWidth: 2, borderColor: Colors._heteroboxd}]}>
      <Pressable onPress={openMenu}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center' }}>
          <UserAvatar pictureUrl={user?.pictureUrl || null} style={[styles.avatar, {width: widescreen ? 32 : 26, height: widescreen ? 32 : 26, borderRadius: widescreen ? 16 : 13}]} />
          <HText style={{color: Colors.text_button, fontSize: widescreen ? 16 : 12}}>
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
          <More width={widescreen ? 18 : 14} height={widescreen ? 18 : 14} />
        </View>
      </Pressable>
    </View>

  const watch = 
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatch}>
        <Eye width={widescreen ? 50 : 35} height={widescreen ? 50 : 35} />
      </Pressable>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Watch</HText>
    </View>

  const watched =
    <View style={styles.buttonContainer}>
      <Pressable onPress={() => {setSeenPressed(true)}}>
        <Watched width={widescreen ? 48 : 33} height={widescreen ? 48 : 33} />
      </Pressable>
      <HText style={{color: Colors._heteroboxd, fontSize: widescreen ? 20 : 18}}>Watched</HText>
    </View>

  const rewatch =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatch}>
        <Rewatch width={widescreen ? 48 : 33} height={widescreen ? 48 : 33} />
      </Pressable>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Rewatch</HText>
    </View>

  const unwatch =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleUnwatch}>
        <EyeOff width={widescreen ? 50 : 35} height={widescreen ? 50 : 35} />
      </Pressable>
      <HText style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Remove</HText>
    </View>

  const watchlist =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatchlist}>
        <Watchlist width={widescreen ? 50 : 35} height={widescreen ? 50 : 35} fill={Colors.text} />
      </Pressable>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 18}}>Watchlist</HText>
    </View>

  const unwatchlist =
    <View style={styles.buttonContainer}>
      <Pressable onPress={handleWatchlist}>
        <Watchlist width={widescreen ? 50 : 35} height={widescreen ? 50 : 35} fill={Colors.heteroboxd} />
      </Pressable>
      <HText style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Unlist</HText>
    </View>

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
        <Pressable style={ratingPending && {opacity: 0.5}} disabled={ratingPending} onPress={() => { closeMenu(); router.push(`/review/alter/${filmId}`) }}>
          <View style={{padding: 20, paddingTop: 0, paddingBottom: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
            <HText style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Review this film</HText>
            <Edit width={28} height={28} />
          </View>
        </Pressable>
        <Divider marginVertical={20} />
        
        <Pressable onPress={() => {closeMenu(); router.push(`/lists/addto/${filmId}`)}}>
          <View style={{padding: 20, paddingTop: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
            <HText style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Add to lists</HText>
            <Addto width={28} height={28} />
          </View>
        </Pressable>

        <Snackbar
          visible={[400, 403, 404, 500].includes(server.result)}
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