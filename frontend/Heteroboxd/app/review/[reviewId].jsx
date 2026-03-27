import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Platform, Pressable, useWindowDimensions, View } from 'react-native'
import Heart from '../../assets/icons/heart.svg'
import Heart2 from '../../assets/icons/heart2.svg'
import Trash from '../../assets/icons/trash.svg'
import Flag from '../../assets/icons/flag.svg'
import Spoiler from '../../assets/icons/spoiler.svg'
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
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import ParsedRead from '../../components/parsedRead'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import ReviewOptionsButton from '../../components/optionButtons/reviewOptionsButton'
import Stars from '../../components/stars'

const PAGE_SIZE = 20

const ReviewWithComments = () => {
  const { reviewId } = useLocalSearchParams()
  const [ review, setReview ] = useState(null)
  const [ showText, setShowText ] = useState(true)
  const { user, isValidSession } = useAuth()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const [ comments, setComments ] = useState(null)
  const [ snack, setSnack ] = useState({ shown: false, msg: '' })
  const [ server, setServer ] = useState(Response.initial)
  const listRef = useRef(null)
  const reviewLocalCopyRef = useRef(null)
  const likeRequestRef = useRef(0)
  const requestRef = useRef(0)
  const loadingRef = useRef(false)

  const loadReviewData = useCallback(async () => {
    setServer(Response.loading)
    try {
      if (user?.userId) {
        const res = await fetch(`${BaseUrl.api}/reviews?ReviewId=${reviewId}&UserId=${user.userId}`)
        if (res.ok) {
          const json = await res.json()
          setReview({...json.review, iLiked: json.iLiked})
          setShowText(!json.review?.spoiler || json.review?.authorId === user.userId || json.uwf)
          setServer(Response.ok)
        } else if (res.status === 404) {
          setServer(Response.notFound)
          setReview({})
        } else {
          setServer(Response.internalServerError)
          setReview({})
        }
      } else {
        const res = await fetch(`${BaseUrl.api}/reviews?ReviewId=${reviewId}`)
        if (res.ok) {
          const json = await res.json()
          setReview({...json, iLiked: false})
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
  }, [user, reviewId])

  const loadCommentsDataPage = useCallback(async (page) => {
    try {
      if (loadingRef.current) return
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(`${BaseUrl.api}/comments/review?ReviewId=${reviewId}&Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setComments({ page: json.page, comments: json.items, totalCount: json.totalCount })
        } else {
          setComments(prev => ({...prev, page: json.page, comments: prev.comments.length > 1000 ? [...prev.comments.slice(-980), ...json.items] : [...prev.comments, ...json.items]}))
        }
        loadingRef.current = false
      } else {
        if (requestId !== requestRef.current) return
        setComments({ page: 1, comments: [], totalCount: 0 })
        console.log('load comments failed; internal server error.')
        loadingRef.current = false
      }
    } catch {
      setComments({ page: 1, comments: [], totalCount: 0 })
      console.log('load comments failed; network error.')
      loadingRef.current = false
    }
  }, [reviewId])

  const totalPages = useMemo(() => Math.ceil(comments?.totalCount / PAGE_SIZE), [comments?.totalCount])

  const loadNextPage = useCallback(() => {
    if (comments?.page < totalPages) {
      loadCommentsDataPage(comments?.page + 1)
    }
  }, [comments?.page, totalPages, loadCommentsDataPage])

  const handleLike = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const currentReview = reviewLocalCopyRef.current
    setReview(prev => ({...prev, likeCount: Math.max(currentReview.likeCount + (currentReview.iLiked ? -1 : 1), 0), iLiked: !currentReview.iLiked}))
    const requestId = ++likeRequestRef.current
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/reviews/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.userId,
          UserName: user.name,
          AuthorId: currentReview.authorId,
          ReviewId: reviewId,
          FilmTitle: currentReview.filmTitle,
          ListId: null,
          ListName: null,
          LikeChange: currentReview.iLiked ? -1 : 1
        })
      })
      if (requestId !== likeRequestRef.current) return
      if (!res.ok) {
        console.log(`${res.status}: like review failed.`)
      }
    } catch {
      if (requestId !== likeRequestRef.current) return
      console.log('like review failed; network error.')
    }
  }, [user, likeRequestRef, reviewId])

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
        loadCommentsDataPage(1)
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
    const prevComments = comments.comments
    const prevCount = comments.totalCount
    setComments(prev => ({...prev, comments: prev.comments.filter(c => c.id !== id), totalCount: prev.totalCount - 1}))
    setSnack({ shown: true, msg: 'Comment deleted!' })
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (!res.ok) {
        setComments(prev => ({ ...prev, comments: prevComments, totalCount: prevCount }))
        setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
      }
    } catch {
      setComments(prev => ({ ...prev, comments: prevComments, totalCount: prevCount }))
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
      const res = await fetch(`${BaseUrl.api}/comments/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setSnack({ shown: true, msg: 'Comment reported!' })
      } else if (res.status === 404) {
        setSnack({ shown: true, msg: `${res.status}: Comment not found! Try reloading Heteroboxd.` })
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
    navigation.setOptions({
      headerRight: () => user ? <ReviewOptionsButton reviewId={review.id} authorId={review.authorId} filmId={review.filmId} notifsOnInitial={review.notificationsOn} onNotifChange={() => setReview(prev => ({...prev, notificationsOn: !prev.notificationsOn}))} pinnedInitial={review.pinned} onPin={() => setReview(prev => ({...prev, pinned: !prev.pinned}))} /> : null
    })
  }, [navigation, user, review])

  useEffect(() => {
    if (!review) return
    loadCommentsDataPage(1) 
  }, [review?.id, loadCommentsDataPage])

  useEffect(() => {
    reviewLocalCopyRef.current = review
  }, [review])

  const widescreen = useMemo(() => width > 1000, [width])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width*0.95), [widescreen, width])
  const spacing = useMemo(() => (widescreen ? 10 : 5), [widescreen])

  const Header = useMemo(() => (
    <View style={{padding: 5, paddingTop: 0, width: widescreen ? 1000 : '100%', alignSelf: 'center'}}>
      <View style={{marginBottom: -5}}>
        <Author
          userId={review?.authorId}
          url={review?.authorPictureUrl || null}
          username={format.sliceText(review?.authorName || 'Anonymous', widescreen ? 50 : 25)}
          admin={review?.admin}
          router={router}
          widescreen={widescreen}
          dim={widescreen ? 40 : 30}
        />
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignSelf: 'center', marginBottom: widescreen ? 15 : 10}}>
        <View style={{flex: 1, justifyContent: 'space-around'}}>
          <HText style={{paddingLeft: 3, color: Colors.text_title, fontWeight: '500', fontSize: widescreen ? 24 : 20, textAlign: 'left', flexShrink: 1}}>{review?.filmTitle}</HText>
          <Stars size={widescreen ? 40 : 30} rating={review?.rating || 0} readonly={true} padding={false} align={'flex-start'} />
          <HText style={{paddingLeft: 3, fontWeight: '400', fontSize: widescreen ? 16 : 13, color: Colors.text, textAlign: 'left'}}>{`Reviewed on ${format.parseDate(review?.date)}`}</HText>
        </View>
        <Pressable onPress={() => router.push(`/film/${review?.filmId}`)}>
          <Poster
            posterUrl={review?.filmPosterUrl || 'noposter'}
            style={{
              width: widescreen ? 200 : 100,
              height: widescreen ? 200*3/2 : 100*3/2,
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
            <ParsedRead html={review.text} contentWidth={maxRowWidth} />
          : (
            <Pressable onPress={() => setShowText(true)}>
              <View style={{width: widescreen ? 750 : '95%', alignSelf: 'center', padding: 25, backgroundColor: Colors.card, borderRadius: 8, borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color, marginVertical: 10, alignItems: 'center', justifyContent: 'center'}}>
                <Spoiler height={widescreen ? 30 : 24} width={widescreen ? 30 : 24} />
                <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>This review contains spoilers.{'\n'}<HText style={{color: Colors.text_link}}>Read anyway?</HText></HText>
              </View>
            </Pressable>
          )
        ) : (
          <View>
            <HText style={{color: Colors.text, fontStyle: 'italic', fontSize: widescreen ? 18 : 14, textAlign: 'left'}}>The author was left speechless.</HText>
          </View>
        )
      }
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between'}}>
        <Pressable onPress={handleLike} style={{flexDirection: 'row', alignItems: 'center'}}>
          {
            review?.iLiked ? (
              <Heart width={widescreen ? 24 : 20} height={widescreen ? 24 : 20} fill={Colors.heteroboxd} />
            ) : (
              <Heart2 width={widescreen ? 24 : 20} height={widescreen ? 24 : 20} />
            )
          }
          <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: 'bold'}}> {format.formatCount(review?.likeCount)} likes</HText>
        </Pressable>
      </View>
      
      <Divider marginVertical={10} />

      {user && <CommentInput onSubmit={handleCreate} widescreen={widescreen} maxRowWidth={maxRowWidth} />}

      <HText style={{color: Colors.text_title, fontSize: widescreen ? 20 : 18, fontWeight: 'bold', marginBottom: 10, paddingLeft: 5}}>Comments ({comments?.totalCount})</HText>
    </View>
  ), [review, router, widescreen, user, maxRowWidth, showText, handleCreate])

  const Comment = useCallback(({ item }) => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      <View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View style={{marginLeft: 10}}>
            <>
            <Author
              userId={item.authorId}
              url={item.authorPictureUrl || null}
              username={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
              admin={item.admin}
              router={router}
              widescreen={widescreen}
              dim={widescreen ? 38 : 28}
            />
            {user?.admin && Platform.OS === 'web' && <HText style={{marginTop: 5, color: Colors.text_placeholder, fontSize: 14}}>{item.id}</HText>}
            </>
          </View>
          {
            user ? (
              <View style={{marginRight: 20}}>
                {
                  user.userId !== item.authorId ? (
                    <Pressable onPress={() => handleReport(item.id)}>
                      <Flag height={widescreen ? 22 : 18} width={widescreen ? 22 : 18} />
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <Trash height={20} width={20} />
                    </Pressable>
                  )
                }
              </View>
            ) : null
          }
        </View>
        <View style={{padding: 10}}>
          <HText style={{fontSize: widescreen ? 16 : 14, color: Colors.text}}>{item.text || ''}</HText>
        </View>
      </View>
      <Divider marginVertical={spacing} />
    </View>
  ), [spacing, widescreen, user, handleDelete, handleReport, router, maxRowWidth])

  const NoComments = useMemo(() => (
    <View style={{width: maxRowWidth, height: 200, alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}}>
      <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center'}}>No comments yet. Be the first to respond!</HText>
    </View>
  ), [maxRowWidth, widescreen])

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
            contentContainerStyle={{flexGrow: 1, paddingBottom: 100}}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.2}
            onEndReached={loadNextPage}
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