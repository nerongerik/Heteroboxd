import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Eye from '../assets/icons/eye.svg'
import EyeOff from '../assets/icons/eye-off2.svg'
import Watchlist from '../assets/icons/bookmark.svg'
import Rewatch from '../assets/icons/rewatch.svg'
import Watched from '../assets/icons/watched.svg'
import Edit from '../assets/icons/edit.svg'
import Addto from '../assets/icons/addto.svg'
import { useRouter } from 'expo-router'
import * as auth from '../helpers/auth'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import Divider from './divider'
import HText from './htext'
import Stars from './stars'

const Interact = ({ widescreen, filmId, close, fade, del }) => {
  const [ seen, setSeen ] = useState(null)
  const [ watchlisted, setWatchlisted ] = useState(null)
  const [ review, setReview ] = useState({ id: null, rating: null, text: null, spoiler: null })
  const [ seenPressed, setSeenPressed ] = useState(false)
  const { user, isValidSession } = useAuth()
  const router = useRouter()
  const reviewRef = useRef(null)
  const watchlistedRef = useRef(null)
  const ratingDebounceRef = useRef(null)
  const watchlistRequestRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/interactions/${filmId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setSeen(json.uwf)
        setReview({ id: json.review?.id || null, rating: json.review?.rating || 0, text: json.review?.text || null, spoiler: json.review?.spoiler || null })
        setWatchlisted(json.watchlisted)
      } else {
        console.log('fetch subsequent failed; internal server error')
      }
    } catch {
      console.log('fetch subsequent failed; network error')
    }
  }, [user, filmId])

  const handleRatingChange = useCallback(async (newRating) => {
    if (!user || !(await isValidSession())) {
      router.replace('login')
    }
    const currentReview = reviewRef.current
    setSeen(true)
    setWatchlisted(false)
    setReview({ id: currentReview?.id || null, rating: newRating, text: currentReview?.text || null, spoiler: currentReview?.spoiler || false })
  
    if (ratingDebounceRef.current) clearTimeout(ratingDebounceRef.current)
    
    ratingDebounceRef.current = setTimeout(async () => {
      try {
        const jwt = await auth.getJwt()
        const reviewAtDispatch = reviewRef.current
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
          setReview(prev => ({ ...prev, id: json.id, rating: json.rating }))
        } else if (res.status === 400) {
          console.log('concurrency race condition')
        } else {
          console.log('rate failed; internal server error')
        }
      } catch {
        console.log('rate failed; network error')
      }
    }, 1000)
  }, [user, filmId, router])

  const handleWatch = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      return
    }
    setSeenPressed(false)
    setSeen(true)
    setWatchlisted(false)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/track/${filmId}?Action=watched`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) return
      if (res.status === 400) {
        console.log('watch failed; bad request')
      } else if (res.status === 404) {
        console.log('watch failed; not found')
      } else {
        console.log('watch failed; internal server error')
      }
    } catch {
      console.log('watch failed; network error')
    }
  }, [user, filmId])

  const handleUnwatch = useCallback(async() => {
    if (!user || !(await isValidSession())) {
      return
    }
    setSeenPressed(false)
    setSeen(false)
    setReview(null)
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/track/${filmId}?Action=unwatched`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) return
      if (res.status === 400) {
        console.log('unwatch failed; bad request')
      } else if (res.status === 404) {
        console.log('unwatch failed; not found')
      } else {
        console.log('unwatch failed; internal server error')
      }
    } catch {
      console.log('unwatch failed; network error')
    }
  }, [user, filmId])

  const handleWatchlist = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      return
    }
    const currentWl = watchlistedRef.current
    setWatchlisted(!currentWl)
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
        console.log('watchlist failed; not found')
      } else {
        console.log('watchlist failed; internal server error')
      }
    } catch {
      if (requestId !== watchlistRequestRef.current) return
      console.log('watchlist failed; network error')
    }
  }, [user, watchlistRequestRef, filmId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!review?.id) return
    setReview(prev => {
      if (prev?.id === review.id) {
        return prev
      }
      return { id: review.id, rating: review.rating, text: review.text, spoiler: review.spoiler }
    })
  }, [review?.id])

  useEffect(() => {
    reviewRef.current = review
  }, [review])

  useEffect(() => {
    watchlistedRef.current = watchlisted
  }, [watchlisted])

  const watch = 
    <View style={styles.buttonContainer}>
      <Pressable onPress={() => {fade(); del(); handleWatch()}}>
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
      <Pressable onPress={() => {fade(); handleUnwatch()}}>
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
      <Pressable onPress={() => {del(); handleWatchlist()}}>
        <Watchlist width={widescreen ? 50 : 35} height={widescreen ? 50 : 35} fill={Colors.heteroboxd} />
      </Pressable>
      <HText style={{color: Colors.heteroboxd, fontSize: widescreen ? 20 : 18}}>Unlist</HText>
    </View>

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
        {seen ? (seenPressed ? (<>{rewatch}{unwatch}</>) : (watched)) : (watch)}
        {watchlisted ? unwatchlist : watchlist}
      </View>
      <Divider marginVertical={20} />
      <Stars
        size={widescreen ? 60 : 50}
        rating={review?.rating || 0}
        onRatingChange={(newRating) => {if (!seen) fade(); del(); handleRatingChange(newRating)}}
        padding={true}
      />
      <HText style={{color: Colors.text, fontSize: 16, alignSelf: 'center'}}>Rate</HText>
      <Divider marginVertical={20} />
      <Pressable onPress={() => { close(); review?.id ? router.push(`/review/${review.id}`) : router.push(`/review/alter/${filmId}`) }}>
        <View style={{padding: 20, paddingTop: 0, paddingBottom: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
          <HText style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Review this film</HText>
          <Edit width={28} height={28} />
        </View>
      </Pressable>
      <Divider marginVertical={20} />
        
      <Pressable onPress={() => {close(); router.push(`/lists/addto/${filmId}`)}}>
        <View style={{padding: 20, paddingTop: 0, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', alignSelf: 'center'}}>
          <HText style={{color: Colors.text, fontSize: widescreen ? 24 : 20, marginRight: 10}}>Add to lists</HText>
          <Addto width={28} height={28} />
        </View>
      </Pressable>
    </View>
  )
}

export default Interact

const styles = StyleSheet.create({
  buttonContainer: {
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15
  }
})