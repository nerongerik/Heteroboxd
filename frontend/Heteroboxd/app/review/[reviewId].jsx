import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons'
import { Snackbar } from 'react-native-paper'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Author from '../../components/author'
import CommentInput from '../../components/commentInput'
import Divider from '../../components/divider'
import LoadingResponse from '../../components/loadingResponse'
import PaginationBar from '../../components/paginationBar'
import ParsedRead from '../../components/parsedRead'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import ReviewOptionsButton from '../../components/optionButtons/reviewOptionsButton'
import Stars from '../../components/stars'

const PAGE_SIZE = 20

const ReviewWithComments = () => {
  const { reviewId } = useLocalSearchParams()
  const [ review, setReview ] = useState(null)
  const [ iLiked, setILiked ] = useState(false)
  const [ showText, setShowText ] = useState(true)
  const { user, isValidSession } = useAuth()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const [ comments, setComments ] = useState(null)
  const [ snack, setSnack ] = useState({ shown: false, msg: '' })
  const [ server, setServer ] = useState(Response.initial)
  const listRef = useRef(null)

  const loadReviewData = useCallback(async () => {
    setServer(Response.loading)
    try {
      if (user?.userId) {
        const res = await fetch(`${BaseUrl.api}/reviews/${reviewId}?UserId=${user.userId}`)
        if (res.ok) {
          const json = await res.json()
          setReview(json.review)
          setShowText(!json.review?.spoiler || json.review?.authorId === user.userId || json.uwf)
          setILiked(json.iLiked)
          setServer(Response.ok)
        } else if (res.status === 404) {
          setServer(Response.notFound)
          setReview({})
        } else {
          setServer(Response.internalServerError)
          setReview({})
        }
      } else {
        const res = await fetch(`${BaseUrl.api}/reviews/${reviewId}`)
        if (res.ok) {
          const json = await res.json()
          setReview(json)
          setShowText(!json?.spoiler)
          setServer(Response.ok)
        } else if (res.status === 404) {
          setServer(Response.notFound)
          setReview({})
        } else {
          setServer(Response.internalServerError)
          setReview({})
        } 
      }
    } catch {
      setServer(Response.networkError)
      setReview({})
    }
  }, [reviewId])

  const loadCommentsDataPage = useCallback(async (page) => {
    try {
      const res = await fetch(`${BaseUrl.api}/comments/review/${reviewId}?Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.ok) {
        const json = await res.json()
        setComments({ page: json.page, comments: json.items, totalCount: json.totalCount })
      } else {
        setComments({ page: 1, comments: [], totalCount: 0 })
        console.log('load comments failed; internal server error.')
      }
    } catch {
      setComments({ page: 1, comments: [], totalCount: 0 })
      console.log('load comments failed; network error.')
    }
  }, [reviewId])

  const handleLike = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const likeChange = iLiked ? -1 : 1
    setILiked(prev => !prev)
    setReview(prev => ({...prev, likeCount: prev.likeCount + likeChange}))
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/reviews/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.userId,
          UserName: user.name,
          AuthorId: review?.authorId,
          ReviewId: reviewId,
          FilmTitle: review?.filmTitle,
          ListId: null,
          ListName: null,
          LikeChange: likeChange
        })
      })
      if (!res.ok) {
        console.log(`${res.status}: like review failed.`)
      }
    } catch {
      console.log('like review failed; network error.')
    }
  }, [user, iLiked, review, reviewId])

  const handleCreate = useCallback(async (text) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          Text: text,
          AuthorId: user.userId,
          AuthorName: user.name,
          ReviewId: reviewId,
          FilmTitle: review?.filmTitle
        })
      })
      if (res.ok) {
        loadCommentsDataPage(Math.ceil(comments?.totalCount / PAGE_SIZE) || 1)
        if (listRef.current) listRef.current.scrollToOffset({ offset: 0, animated: true })
      } else {
        setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
      }
    } catch {
      setSnack({ shown: true, msg: 'Network error! Please check your internet connection and try again.' })
    }
  }, [user, reviewId, review, comments])

  const handleDelete = useCallback(async (id) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setSnack({ shown: true, msg: 'Comment deleted!' })
        loadCommentsDataPage(comments?.page || 1)
      } else {
        setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
      }
    } catch {
      setSnack({ shown: true, msg: 'Network error! Please check your internet connection and try again.' })
    }
  }, [user, comments])

  const handleReport = useCallback(async (id) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/comments/report/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setSnack({ shown: true, msg: 'Comment reported!' })
      } else {
        setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
      }
    } catch {
      setSnack({ shown: true, msg: 'Network error! Please check your internet connection and try again.' })
    }
  }, [user])

  useEffect(() => {
    loadReviewData()
  }, [loadReviewData])

  useEffect(() => {
    if (!review) return
    loadCommentsDataPage(1) 
  }, [review?.id, loadCommentsDataPage])

  useEffect(() => {
    if (!review) return
    navigation.setOptions({
      headerTitle: review.authorName + "'s review",
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => user ? <ReviewOptionsButton reviewId={review.id} authorId={review.authorId} filmId={review.filmId} notifsOnInitial={review.notificationsOn} onNotifChange={() => setReview(prev => ({...prev, notificationsOn: !prev.notificationsOn}))} /> : null
    })
  }, [navigation, user, review])

  const widescreen = useMemo(() => width > 1000, [width])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width*0.95), [widescreen, width])
  const spacing = useMemo(() => (widescreen ? 10 : 5), [widescreen])

  const Header = () => (
    <View style={{padding: 5, paddingTop: 0, width: widescreen ? 1000 : '100%', alignSelf: 'center'}}>
      <View style={{marginBottom: -5}}>
        <Author
          userId={review?.authorId}
          url={review?.authorProfilePictureUrl}
          username={review?.authorName}
          admin={review?.admin}
          router={router}
          widescreen={widescreen}
        />
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignSelf: 'center'}}>
        <View style={{flex: 1, justifyContent: 'space-around'}}>
          <Text style={{paddingLeft: 3, color: Colors.text_title, fontWeight: '500', fontSize: widescreen ? 24 : 20, textAlign: 'left', flexShrink: 1}}>{review?.filmTitle}</Text>
          <Stars size={widescreen ? 40 : 30} rating={review?.rating ?? 0} readonly={true} padding={false} align={'flex-start'} />
          <Text style={{paddingLeft: 3, fontWeight: '400', fontSize: widescreen ? 16 : 13, color: Colors.text, textAlign: 'left'}}>{`Reviewed on ${format.parseDate(review?.date)}`}</Text>
        </View>
        <Pressable onPress={() => router.push(`/film/${review?.filmId}`)}>
          <Poster
            posterUrl={review?.filmPosterUrl}
            style={{
              width: widescreen ? 150 : 100,
              height: widescreen ? 150*3/2 : 100*3/2,
              borderWidth: 2,
              borderRadius: 4,
              marginRight: 5,
              borderColor: Colors.border_color
            }}
          />
        </Pressable>
      </View>
      {
        review?.text?.length > 0 ? (
          showText ?
            <ParsedRead html={review.text} />
          : (
            <Pressable onPress={() => setShowText(true)}>
              <View style={{width: widescreen ? 750 : '95%', alignSelf: 'center', padding: 25, backgroundColor: Colors.card, borderRadius: 8, borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color, marginVertical: 10, alignItems: 'center', justifyContent: 'center'}}>
                <Ionicons name="warning-outline" size={widescreen ? 30 : 24} color={Colors.text} />
                <Text style={{color: Colors.text, fontSize: 16, textAlign: 'center'}}>This review contains spoilers.<Text style={{color: Colors.text_link}}> Read anyway?</Text></Text>
              </View>
            </Pressable>
          )
        ) : (
          <View>
            <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'left'}}>{review?.authorName} wrote no review regarding this film.</Text>
          </View>
        )
      }
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between'}}>
        <Pressable onPress={handleLike} style={{flexDirection: 'row', alignItems: 'center'}}>
          { iLiked ? (
            <MaterialCommunityIcons style={{marginRight: 3}} name='cards-heart' size={widescreen ? 24 : 20} color={Colors.heteroboxd} />
          ) : (
            <MaterialCommunityIcons style={{marginRight: 3}} name='cards-heart-outline' size={widescreen ? 24 : 20} color={Colors.text} />
          )}
          <Text style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: 'bold'}}>{format.formatCount(review?.likeCount)} likes</Text>
        </Pressable>
      </View>
      
      <Divider marginVertical={10} />

      {user && <CommentInput onSubmit={handleCreate} widescreen={widescreen} maxRowWidth={maxRowWidth} />}

      <Text style={{color: Colors.text_title, fontSize: widescreen ? 20 : 18, fontWeight: 'bold', marginBottom: 10, paddingLeft: 5}}>Comments ({comments?.totalCount})</Text>
    </View>
  )

  const Comment = ({ item }) => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      <View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View style={{marginLeft: 10}}>
            <Author
              userId={item.authorId}
              url={item.authorProfilePictureUrl}
              username={item.authorName}
              admin={item.admin}
              router={router}
              widescreen={widescreen}
            />
          </View>
          {
            user ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginRight: 20}}>
                {
                  !user.admin && user.userId !== item.authorId && (
                    <Pressable onPress={() => handleReport(item.id)}>
                      <Octicons name='report' size={widescreen ? 22 : 18} color={Colors.text} />
                    </Pressable>
                  )
                }
                {
                  (user.userId === item.authorId) && (
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <MaterialIcons name='delete-forever' size={widescreen ? 24 : 20} color={Colors.text} />
                    </Pressable>
                  )
                }
              </View>
            ) : null
          }
        </View>
        <View style={{padding: 10}}>
          <ParsedRead html={`${item.text.replace(/\n{3,}/g, '\n\n').trim()}`} />
        </View>
      </View>
      <Divider marginVertical={spacing} />
    </View>
  )

  const NoComments = () => (
    <View style={{width: maxRowWidth, height: 200, alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center'}}>No comments yet. Be the first to respond!</Text>
    </View>
  )

  const Footer = () => {
    if (comments?.comments.length === 0) return null
    return (
      <View style={{paddingBottom: 100}}>
        <PaginationBar
          page={comments?.page}
          totalPages={Math.ceil(comments?.totalCount / PAGE_SIZE)}
          onPagePress={(num) => {
            setComments(null)
            loadCommentsDataPage(num)
            listRef.current?.scrollToOffset({
              offset: 0,
              animated: true,
            })
          }}
        />
      </View>
    )
  }

  if (!review) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      {
        !comments ? (
          <View style={{width: widescreen ? 1000 : width*0.95, alignItems: 'center', paddingVertical: 30}}>
            <ActivityIndicator size='large' color={Colors.text_link} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={comments.comments}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={Header}
            renderItem={Comment}
            ListEmptyComponent={NoComments}
            ListFooterComponent={Footer}
            contentContainerStyle={{flexGrow: 1, paddingBottom: 100}}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        )
      }

      <Popup 
        visible={[403, 404, 500].includes(server.result)} 
        message={server.message} 
        onClose={() => { server.result === 403 ? router.replace('/login') : server.result === 404 ? router.back() : router.replace(`/contact`) }}
      />

      <Snackbar
        visible={snack.shown}
        onDismiss={() => setSnack(prev => ({...prev, shown: false}))}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? width*0.5 : width*0.9,
          alignSelf: 'center',
          borderRadius: 8
        }}
        action={{
          label: 'OK',
          onPress: () => setSnack(prev => ({...prev, shown: false})),
          textColor: Colors.text_link,
        }}
      >
        {snack.msg}
      </Snackbar>
    </View>
  )
}

export default ReviewWithComments