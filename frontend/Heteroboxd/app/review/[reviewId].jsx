import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, KeyboardAvoidingView, PanResponder, Platform, Pressable, useWindowDimensions, Vibration, View, RefreshControl, StyleSheet, TextInput } from 'react-native'
import Heart from '../../assets/icons/heart.svg'
import Heart2 from '../../assets/icons/heart2.svg'
import Trash from '../../assets/icons/trash.svg'
import Flag from '../../assets/icons/flag.svg'
import Reply from '../../assets/icons/reply.svg'
import X from '../../assets/icons/x.svg'
import Spoiler from '../../assets/icons/spoiler.svg'
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
import Divider from '../../components/divider'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import ParsedRead from '../../components/parsedRead'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import ReviewOptionsButton from '../../components/optionButtons/reviewOptionsButton'
import Stars from '../../components/stars'

const PAGE_SIZE = 20
const SWIPE_REPLY_OFFSET = 50
const REPLY_HOLD_DELAY = 50
const TOMBSTONE_MESSAGES = {
  DeletedByAuthor: 'This comment was deleted by the original author',
  DeletedByAdmin: 'This comment was deleted by a community moderator',
  OriginalAuthorDeleted: 'This comment was written by a user that no longer exists'
}

const getTombstoneMessage = (tombstone) => TOMBSTONE_MESSAGES[tombstone] || null

const retainCompleteCommentThreads = (comments, limit = 1000) => {
  const threads = []
  const threadIndexes = new Map()

  comments.forEach(comment => {
    const threadKey = comment.threadRootId ?? comment.id
    if (!threadIndexes.has(threadKey)) {
      threadIndexes.set(threadKey, threads.length)
      threads.push([])
    }
    threads[threadIndexes.get(threadKey)].push(comment)
  })

  let retainedCount = comments.length
  let firstRetainedThread = 0
  while (retainedCount > limit && firstRetainedThread < threads.length - 1) {
    retainedCount -= threads[firstRetainedThread].length
    firstRetainedThread += 1
  }

  return threads.slice(firstRetainedThread).flat()
}

const isMobileWebBrowser = () => {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false
  const mobileUserAgent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
  const touchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return mobileUserAgent || touchMac
}

const MOBILE_WEB = isMobileWebBrowser()
const DESKTOP_WEB = Platform.OS === 'web' && !MOBILE_WEB
const SWIPE_REPLY = Platform.OS === 'android' || MOBILE_WEB

const CommentText = ({ item, widescreen, compact = false }) => {
  const isReply = item.repliedCommentId !== null && item.repliedCommentId !== undefined && item.repliedUserName !== null && item.repliedUserName !== undefined

  return (
    <HText style={{fontSize: compact ? (widescreen ? 14 : 12) : (widescreen ? 16 : 14), color: Colors.text}}>
      {isReply ? (
        <>
          <Link push href={`/profile/${item.repliedUserName}`} style={{color: Colors.heteroboxd, fontSize: compact ? (widescreen ? 14 : 12) : (widescreen ? 16 : 14), fontFamily: 'Inter_400Regular', textDecorationLine: 'none'}}>{item.repliedUserName}</Link>
          {' '}
        </>
      ) : null}
      {item.text || ''}
    </HText>
  )
}

const ReplyPreview = ({ item, widescreen, router, onCancel }) => (
  <View style={{backgroundColor: Colors.background, borderWidth: 1, borderRadius: 4, borderColor: Colors._heteroboxd, opacity: 0.8}}>
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <View style={{flex: 1}}>
        <View style={{marginLeft: 10}}>
          <Author
            userId={item.authorId}
            url={item.authorPictureUrl || null}
            name={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
            username={item.authorUserName ? format.sliceText(item.authorUserName, widescreen ? 50 : 25) : null}
            admin={item.admin}
            router={router}
            widescreen={widescreen}
            dim={widescreen ? 38 : 28}
          />
        </View>
        <View style={{padding: 10}}>
          <CommentText item={item} widescreen={widescreen} />
        </View>
      </View>
      <Pressable onPress={onCancel} style={{padding: 10, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center'}}>
        <X width={widescreen ? 22 : 18} height={widescreen ? 22 : 18} />
      </Pressable>
    </View>
  </View>
)

const CommentCard = ({ item, maxRowWidth, widescreen, router, user, handleReport, handleDelete, handleCommentReply, spacing, replyEnabled, desktopReply, swipeReply, commentHovered, setCommentHovered, hasThreadReplies, hasNextThreadReply }) => {
  const translateX = useRef(new Animated.Value(0)).current
  const holdTimerRef = useRef(null)
  const armedRef = useRef(false)
  const reachedThresholdRef = useRef(false)
  const vibratedRef = useRef(false)
  const tombstoneMessage = getTombstoneMessage(item.tombstone)
  const isTombstoned = item.tombstone !== null && item.tombstone !== undefined
  const isThreadReply = item.threadRootId !== null && item.threadRootId !== undefined
  const threadIndent = Math.min(widescreen ? 50 : 30, maxRowWidth)
  const replyIndent = isThreadReply ? threadIndent : 0
  const commentWidth = Math.max(maxRowWidth - replyIndent, 0)
  const threadConnectorX = threadIndent/2
  const replyConnectorY = widescreen ? 21 : 17
  const showAuthor = item.tombstone !== 'OriginalAuthorDeleted'
  const replyEligible = !isTombstoned && replyEnabled && user?.userId !== item.authorId
  const canReport = user?.userId !== item.authorId
  const actionIconSize = canReport
    ? (isThreadReply ? (widescreen ? 20 : 18) : (widescreen ? 24 : 20))
    : (isThreadReply ? (widescreen ? 18 : 16) : (widescreen ? 22 : 18))
  const rootActionIconSize = canReport ? (widescreen ? 24 : 20) : (widescreen ? 22 : 18)
  const actionMarginRight = isThreadReply ? 20 + (rootActionIconSize - actionIconSize)/2 : 20

  const handleHoverIn = useCallback(() => {
    if (!replyEligible || !desktopReply) return
    setCommentHovered(item.id)
  }, [replyEligible, desktopReply, setCommentHovered, item.id])

  const handleHoverOut = useCallback(() => {
    if (!replyEligible || !desktopReply) return
    setCommentHovered(current => current === item.id ? null : current)
  }, [replyEligible, desktopReply, setCommentHovered, item.id])

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback(() => {
    if (!replyEligible || !swipeReply) return
    clearHoldTimer()
    translateX.setValue(0)
    armedRef.current = false
    reachedThresholdRef.current = false
    vibratedRef.current = false
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null
      armedRef.current = true
      if (Platform.OS === 'android' && !vibratedRef.current) {
        vibratedRef.current = true
        Vibration.vibrate(30)
      }
    }, REPLY_HOLD_DELAY)
  }, [replyEligible, swipeReply, clearHoldTimer, translateX])

  const handleTouchEnd = useCallback(() => {
    if (!replyEligible || !swipeReply) return
    clearHoldTimer()
    armedRef.current = false
  }, [replyEligible, swipeReply, clearHoldTimer])

  const replyIconOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_REPLY_OFFSET],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  })

  const resetSwipeInteraction = useCallback(() => {
    clearHoldTimer()
    translateX.setValue(0)
    armedRef.current = false
    reachedThresholdRef.current = false
    vibratedRef.current = false
  }, [clearHoldTimer, translateX])

  const handleTouchCancel = useCallback(() => {
    if (!replyEligible || !swipeReply) return
    resetSwipeInteraction()
  }, [replyEligible, swipeReply, resetSwipeInteraction])

  useEffect(() => () => {
    clearHoldTimer()
    translateX.stopAnimation()
    translateX.setValue(0)
    armedRef.current = false
    reachedThresholdRef.current = false
    vibratedRef.current = false
  }, [clearHoldTimer, translateX])

  const panResponder = useMemo(() => {
    if (!replyEligible || !swipeReply) return null
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        if (!armedRef.current) {
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) clearHoldTimer()
          return false
        }
        return dx > 5 && dx > Math.abs(dy) * 1.5
      },
      onPanResponderGrant: () => {
        translateX.setValue(0)
        reachedThresholdRef.current = false
      },
      onPanResponderMove: (_, { dx }) => {
        const clampedX = Math.max(0, Math.min(dx, SWIPE_REPLY_OFFSET))
        translateX.setValue(clampedX)
        reachedThresholdRef.current = clampedX === SWIPE_REPLY_OFFSET
      },
      onPanResponderRelease: () => {
        const shouldReply = reachedThresholdRef.current
        resetSwipeInteraction()
        if (shouldReply) handleCommentReply(item.id, item.authorId)
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: resetSwipeInteraction
    })
  }, [replyEligible, swipeReply, clearHoldTimer, translateX, resetSwipeInteraction, handleCommentReply, item.id, item.authorId])

  const showDesktopReply = !isTombstoned && replyEligible && desktopReply && commentHovered === item.id

  return (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      {hasThreadReplies ? (
        <View pointerEvents='none' style={{position: 'absolute', left: threadConnectorX, top: 0, bottom: 0, width: 2, backgroundColor: Colors.text}} />
      ) : null}
      {isThreadReply ? (
        <>
          <View
            pointerEvents='none'
            style={{
              position: 'absolute',
              left: threadConnectorX,
              top: -spacing,
              width: Math.max(threadIndent - threadConnectorX, 0),
              height: spacing*2 + replyConnectorY,
              borderLeftWidth: 2,
              borderBottomWidth: 2,
              borderBottomLeftRadius: widescreen ? 10 : 8,
              borderColor: Colors.text
            }}
          />
          {hasNextThreadReply ? (
            <View pointerEvents='none' style={{position: 'absolute', left: threadConnectorX, top: replyConnectorY, bottom: 0, width: 2, backgroundColor: Colors.text}} />
          ) : null}
        </>
      ) : null}
      <View style={{width: commentWidth, marginLeft: replyIndent}}>
        <View
          style={{position: 'relative', overflow: 'hidden'}}
          {...(replyEligible && desktopReply ? { onMouseEnter: handleHoverIn, onMouseLeave: handleHoverOut } : {})}
          {...(replyEligible && swipeReply ? { onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, onTouchCancel: handleTouchCancel } : {})}
          {...(panResponder?.panHandlers ?? {})}
        >
          {replyEligible && swipeReply ? (
            <Animated.View style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: SWIPE_REPLY_OFFSET, opacity: replyIconOpacity, pointerEvents: 'none', alignItems: 'center', justifyContent: 'center'}}>
              <Reply width={isThreadReply ? (widescreen ? 18 : 14) : (widescreen ? 20 : 16)} height={isThreadReply ? (widescreen ? 18 : 14) : (widescreen ? 20 : 16)} />
            </Animated.View>
          ) : null}
          <Animated.View style={[{backgroundColor: Colors.background}, replyEligible && swipeReply ? { transform: [{ translateX }] } : null]}>
            {showAuthor ? (
              <View style={{marginLeft: isThreadReply ? 8 : 10}}>
                <Author
                  userId={item.authorId}
                  url={item.authorPictureUrl || null}
                  name={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
                  username={item.authorUserName ? format.sliceText(item.authorUserName, widescreen ? 50 : 25) : null}
                  admin={item.admin}
                  router={router}
                  widescreen={widescreen}
                  dim={isThreadReply ? (widescreen ? 32 : 24) : (widescreen ? 38 : 28)}
                  compact={isThreadReply}
                />
                {!isTombstoned && user?.admin && Platform.OS === 'web' && <HText style={{marginTop: isThreadReply ? 4 : 5, color: Colors.text_placeholder, fontSize: isThreadReply ? (widescreen ? 12 : 10) : 14}}>{item.id}</HText>}
              </View>
            ) : null}
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {showDesktopReply ? (
                <Pressable onPress={() => handleCommentReply(item.id, item.authorId)} style={{padding: isThreadReply ? 8 : 10, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center'}}>
                  <Reply width={isThreadReply ? (widescreen ? 18 : 14) : (widescreen ? 20 : 16)} height={isThreadReply ? (widescreen ? 18 : 14) : (widescreen ? 20 : 16)} />
                </Pressable>
              ) : null}
              <View style={{padding: isThreadReply ? 8 : 10, flex: 1}}>
                {tombstoneMessage ? (
                  <HText style={{color: Colors.text, fontStyle: 'italic', fontSize: isThreadReply ? (widescreen ? 16 : 12) : (widescreen ? 18 : 14), textAlign: 'left'}}>{tombstoneMessage}</HText>
                ) : (
                  <CommentText item={item} widescreen={widescreen} compact={isThreadReply} />
                )}
              </View>
              {
                user && !isTombstoned ? (
                  <View style={{marginRight: actionMarginRight}}>
                    {
                      canReport ? (
                        <Pressable onPress={() => handleReport(item.id)} hitSlop={isThreadReply ? 4 : undefined}>
                          <Flag height={actionIconSize} width={actionIconSize} />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => handleDelete(item.id)} hitSlop={isThreadReply ? 4 : undefined}>
                          <Trash height={actionIconSize} width={actionIconSize} />
                        </Pressable>
                      )
                    }
                  </View>
                ) : null
              }
            </View>
          </Animated.View>
        </View>
        <View height={spacing*2} />
      </View>
    </View>
  )
}

const ReviewWithComments = () => {
  const { reviewId } = useLocalSearchParams()
  const [ review, setReview ] = useState(null)
  const [ showText, setShowText ] = useState(true)
  const { user, isValidSession } = useAuth()
  const { width } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const [ comments, setComments ] = useState({ page: 1, comments: [], totalCount: 0, threadCount: 0 })
  const [ replyTarget, setReplyTarget ] = useState({
    repliedCommentId: null,
    repliedUserId: null
  })
  const [ replyPreview, setReplyPreview ] = useState(null)
  const [ commentHovered, setCommentHovered ] = useState(null)
  const [ commentText, setCommentText ] = useState('')
  const commentInputRef = useRef(null)
  const [ commentInputFocused, setCommentInputFocused ] = useState(false)
  const [ snack, setSnack ] = useState({ shown: false, msg: '' })
  const [ server, setServer ] = useState(Response.initial)
  const listRef = useRef(null)
  const composerOffsetRef = useRef(null)
  const pendingReplyFocusRef = useRef(false)
  const replyFocusFrameRef = useRef(null)
  const reviewLocalCopyRef = useRef(null)
  const likeRequestRef = useRef(0)
  const requestRef = useRef(0)
  const lastPageRef = useRef(0)
  const [ isRefreshing, setIsRefreshing ] = useState(false)

  const cancelScheduledReplyFocus = useCallback(() => {
    if (replyFocusFrameRef.current !== null) {
      cancelAnimationFrame(replyFocusFrameRef.current)
      replyFocusFrameRef.current = null
    }
    pendingReplyFocusRef.current = false
  }, [])

  const completeReplyScroll = useCallback(() => {
    if (!pendingReplyFocusRef.current || composerOffsetRef.current === null) return
    pendingReplyFocusRef.current = false
    listRef.current?.scrollToOffset({ offset: Math.max(composerOffsetRef.current - 10, 0), animated: true })
  }, [])

  const scheduleReplyFocus = useCallback(() => {
    if (replyFocusFrameRef.current !== null) cancelAnimationFrame(replyFocusFrameRef.current)
    pendingReplyFocusRef.current = true
    replyFocusFrameRef.current = requestAnimationFrame(() => {
      replyFocusFrameRef.current = requestAnimationFrame(() => {
        replyFocusFrameRef.current = null
        completeReplyScroll()
        commentInputRef.current?.focus()
      })
    })
  }, [completeReplyScroll])

  const handleCommentComposerLayout = useCallback((event) => {
    composerOffsetRef.current = event.nativeEvent.layout.y
    if (pendingReplyFocusRef.current && replyFocusFrameRef.current === null) scheduleReplyFocus()
  }, [scheduleReplyFocus])

  const loadReviewData = useCallback(async (fromRefresh = false) => {
    if (fromRefresh) setIsRefreshing(false)
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

  const loadCommentsDataPage = useCallback(async (page, fromCreate = false) => {
    if (page !== 1 && lastPageRef.current >= page) {
      return
    }
    if (!review || (!fromCreate && review.commentCount === 0)) {
      return
    }
    setServer(Response.loading)
    try {
      const requestId = ++requestRef.current
      const res = await fetch(`${BaseUrl.api}/comments/review?ReviewId=${reviewId}&Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setComments({ page: json.page, comments: json.items, totalCount: json.totalCount, threadCount: json.threadCount ?? json.totalCount })
        } else {
          setComments(prev => ({...prev, page: json.page, comments: retainCompleteCommentThreads([...prev.comments, ...json.items])}))
        }
        lastPageRef.current = page
        setServer(Response.ok)
      } else {
        if (requestId !== requestRef.current) return
        setComments({ page: 1, comments: [], totalCount: 0, threadCount: 0 })
        console.log('load comments failed; internal server error.')
        setServer(Response.internalServerError)
      }
    } catch {
      setComments({ page: 1, comments: [], totalCount: 0, threadCount: 0 })
      console.log('load comments failed; network error.')
      setServer(Response.networkError)
    }
  }, [reviewId, review?.id])

  const totalPages = useMemo(() => Math.ceil((comments?.threadCount ?? comments?.totalCount ?? 0) / PAGE_SIZE), [comments?.threadCount, comments?.totalCount])

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

  const clearCommentReply = useCallback(() => {
    cancelScheduledReplyFocus()
    setReplyTarget({
      repliedCommentId: null,
      repliedUserId: null
    })
    setReplyPreview(null)
  }, [cancelScheduledReplyFocus])

  const handleCreate = useCallback(async (text) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const hasReplyTarget = replyTarget.repliedCommentId !== null && replyTarget.repliedUserId !== null
      const res = await fetch(`${BaseUrl.api}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          Text: text,
          AuthorId: user.userId,
          AuthorName: user.name,
          ReviewId: reviewId,
          FilmTitle: review?.filmTitle,
          RepliedCommentId: hasReplyTarget ? replyTarget.repliedCommentId : null,
          RepliedUserId: hasReplyTarget ? replyTarget.repliedUserId : null
        })
      })
      if (res.ok) {
        loadCommentsDataPage(1, true)
        if (listRef.current) listRef.current.scrollToOffset({ offset: 0, animated: true })
      } else {
        setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
      }
    } catch {
      setSnack({ shown: true, msg: 'Network error! Please check your internet connection and try again.' })
    }
  }, [user, reviewId, review, comments, replyTarget])

  const handleCommentSubmit = useCallback(() => {
    if (commentText.trim().length > 0 && commentText.trim().length <= 500) {
      handleCreate(commentText)
      clearCommentReply()
      setCommentText('')
    }
  }, [commentText, handleCreate, clearCommentReply])

  const handleDelete = useCallback(async (id) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const previousComment = comments.comments.find(comment => comment.id === id)
    if (!previousComment) return
    const restoreComment = () => setComments(prev => ({
      ...prev,
      comments: prev.comments.map(comment => comment.id === id ? previousComment : comment)
    }))
    setComments(prev => ({
      ...prev,
      comments: prev.comments.map(comment => comment.id === id ? { ...comment, text: '', tombstone: 'DeletedByAuthor' } : comment)
    }))
    setSnack({ shown: true, msg: 'Comment deleted!' })
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/comments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (!res.ok) {
        restoreComment()
        setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
      }
    } catch {
      restoreComment()
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

  const handleCommentReply = useCallback(async (commentId, authorId) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    if (authorId === user.userId) return
    const selectedComment = comments.comments.find(comment => comment.id === commentId && comment.authorId === authorId && !comment.tombstone)
    if (!selectedComment) return
    const previewVisible = replyTarget.repliedCommentId !== null && replyTarget.repliedUserId !== null && replyPreview !== null
    if (!previewVisible) composerOffsetRef.current = null
    setReplyPreview(selectedComment)
    setReplyTarget({
      repliedCommentId: commentId,
      repliedUserId: authorId
    })
    scheduleReplyFocus()
  }, [user, isValidSession, comments.comments, replyTarget.repliedCommentId, replyTarget.repliedUserId, replyPreview, scheduleReplyFocus])

  const handleCancelCommentReply = useCallback(() => {
    clearCommentReply()
    setCommentText('')
    commentInputRef.current?.blur()
    setCommentInputFocused(false)
  }, [clearCommentReply])

  useEffect(() => () => {
    cancelScheduledReplyFocus()
  }, [cancelScheduledReplyFocus])

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
    loadCommentsDataPage(1) 
  }, [loadCommentsDataPage])

  useEffect(() => {
    reviewLocalCopyRef.current = review
  }, [review])

  const widescreen = useMemo(() => width > 1000, [width])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width*0.95), [widescreen, width])
  const spacing = useMemo(() => (widescreen ? 10 : 5), [widescreen])

  const Header = useMemo(() => (
    <View style={{padding: 5, paddingTop: 0, width: widescreen ? 1000 : '100%', alignSelf: 'center'}}>
      {
        user && !user.verified && review?.authorId === user.userId && (
        <>
          <Link href={`/profile/${user.userId}`} style={{padding: 10, textAlign: 'center', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12, fontFamily: 'Inter_400Regular'}}>Your account is not verified! Until you verify your account, all your reviews will remain private and won't show up for other users.</Link>
          <View style={{height: 20}} />
        </>
        )
      }
      <View style={{marginBottom: -5}}>
        <Author
          userId={review?.authorId}
          url={review?.authorPictureUrl || null}
          name={format.sliceText(review?.authorName || 'Anonymous', widescreen ? 50 : 25)}
          username={review?.authorUserName ? format.sliceText(review.authorUserName, widescreen ? 50 : 25) : null}
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
            <Pressable onPress={() => {
              if (Platform.OS === 'android') Vibration.vibrate(30)
              setShowText(true)
            }}>
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

      {replyTarget.repliedCommentId !== null && replyTarget.repliedUserId !== null && replyPreview ? (
        <View style={{width: maxRowWidth*0.75, alignSelf: 'center', marginBottom: 5}}>
          <ReplyPreview item={replyPreview} widescreen={widescreen} router={router} onCancel={handleCancelCommentReply} />
        </View>
      ) : null}

      <View onLayout={handleCommentComposerLayout}>
        {(user && user.verified) ?
          <View style={[styles.commentInputContainer, {width: maxRowWidth, alignSelf: 'center'}]}>
            <View style={styles.descWrapper}>
              <TextInput
                ref={commentInputRef}
                value={commentText}
                onChangeText={setCommentText}
                placeholder='Add a comment…'
                placeholderTextColor={Colors.text_placeholder}
                style={[styles.commentInput, {fontSize: widescreen ? 16 : 14, height: widescreen ? 60 : 50, borderWidth: commentInputFocused ? 1 : null, borderColor: commentInputFocused ? Colors.heteroboxd : null}]}
                onFocus={() => setCommentInputFocused(true)}
                onBlur={() => setCommentInputFocused(false)}
                onSubmitEditing={() => {
                  if (commentText.trim().length > 0 && commentText.trim().length < 500) {
                    handleCommentSubmit()
                  }
                }}
                returnKeyType='send'
              />
              <HText style={[styles.counterText, {fontSize: widescreen ? 14 : 12}, {color: commentText.trim().length < 501 ? Colors.text_title : Colors.password_meager}]}>
                {commentText.trim().length}/500
              </HText>
            </View>
            <Pressable
              style={(commentText.trim().length === 0 || commentText.trim().length > 500) && { opacity: 0.5 }}
              onPress={handleCommentSubmit}
              disabled={commentText.trim().length === 0 || commentText.trim().length > 500}
            >
              <HText style={{color: Colors.text_title, fontSize: widescreen ? 32 : 24, marginBottom: 10}}>{' ➜'}</HText>
            </Pressable>
          </View>
        : (user && !user.verified) ?
          <>
            <Link href={`/profile/${user.userId}`} style={{padding: 10, textAlign: 'center', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12, fontFamily: 'Inter_400Regular'}}>You must verify your account to leave comments.</Link>
            <Divider marginVertical={10} />
          </>
          : null
        }
      </View>

      <HText style={{color: Colors.text_title, fontSize: widescreen ? 20 : 18, fontWeight: 'bold', marginBottom: 10, paddingLeft: 5}}>Comments ({comments?.totalCount || 0})</HText>
    </View>
  ), [review, router, widescreen, user, maxRowWidth, showText, commentText, commentInputFocused, handleCommentSubmit, handleCommentComposerLayout, replyTarget, replyPreview, handleCancelCommentReply])

  const Comment = useCallback(({ item, index }) => {
    const nextComment = comments.comments[index + 1]
    const isThreadReply = item.threadRootId !== null && item.threadRootId !== undefined
    const hasThreadReplies = !isThreadReply && nextComment?.threadRootId === item.id
    const hasNextThreadReply = isThreadReply && nextComment?.threadRootId === item.threadRootId

    return (
      <CommentCard
        item={item}
        maxRowWidth={maxRowWidth}
        widescreen={widescreen}
        router={router}
        user={user}
        handleReport={handleReport}
        handleDelete={handleDelete}
        handleCommentReply={handleCommentReply}
        spacing={spacing}
        replyEnabled={Boolean(user)}
        desktopReply={DESKTOP_WEB}
        swipeReply={SWIPE_REPLY}
        commentHovered={commentHovered}
        setCommentHovered={setCommentHovered}
        hasThreadReplies={hasThreadReplies}
        hasNextThreadReply={hasNextThreadReply}
      />
    )
  }, [comments.comments, spacing, widescreen, user, handleDelete, handleReport, handleCommentReply, router, maxRowWidth, commentHovered])

  const NoComments = useMemo(() => server.result > 0 ? (
    <View style={{width: maxRowWidth, height: 50, alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}}>
      <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>Nothing to see here.</HText>
    </View>
  ) : (
    <View style={{width: maxRowWidth, height: 50, alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator color={Colors.heteroboxd} size='large' />
    </View>
  ), [maxRowWidth, widescreen, server.result])

  const Footer = useMemo(() => comments.comments.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [comments.comments.length, server.result])

  if (!review) {
    return (
      <>
      <Head>
        <title>Review</title>
        <meta name="description" content={`The review of a film.`} />
        <meta property="og:title" content="Review" />
        <meta property="og:description" content={`The review of a film`} />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
      </Head>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
      </>
    )
  }

  return (
    <>
    <Head>
      <title>Review of {review?.filmTitle}</title>
      <meta name="description" content={`The ${review?.rating}-star review of ${review?.filmTitle}`} />
      <meta property="og:title" content={`Review of ${review?.filmTitle}`} />
      <meta property="og:description" content={`The ${review?.rating}-star review of ${review?.filmTitle}`} />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={async () => {
              setReview(null)
              lastPageRef.current = 0
              setComments({ page: 1, comments: [], totalCount: 0, threadCount: 0 })
              setIsRefreshing(true)
              await loadReviewData(true)
              loadCommentsDataPage(1)
            }}
          />
        }
        keyboardShouldPersistTaps={"handled"}
      />
      </KeyboardAvoidingView>

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
    </>
  )
}

export default ReviewWithComments

const styles = StyleSheet.create({
  commentInputContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    color: Colors.text_input,
    padding: 10,
    backgroundColor: Colors.card,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    borderRadius: 4,
    textAlignVertical: 'top',
  },
  descWrapper: {
    marginBottom: 10,
    flex: 1,
  },
  counterText: {
    bottom: 5,
    position: 'absolute',
    right: 10
  }
})
