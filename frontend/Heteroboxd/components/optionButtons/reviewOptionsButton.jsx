import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import More from '../../assets/icons/more.svg'
import Flag from '../../assets/icons/flag.svg'
import Trash from '../../assets/icons/trash.svg'
import Notif from '../../assets/icons/notifications.svg'
import NotifOff from '../../assets/icons/notifications-off.svg'
import Edit from '../../assets/icons/edit.svg'
import { Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import HText from '../htext'
import LoadingResponse from '../loadingResponse'
import SlidingMenu from '../slidingMenu'

const ReviewOptionsButton = ({ reviewId, authorId, filmId, notifsOnInitial, onNotifChange }) => {
  const { user, isValidSession } = useAuth()
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ notifsOnLocal, setNotifsOnLocal ] = useState(true)
  const [ server, setServer ] = useState(Response.initial)

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
      useNativeDriver: true
    }).start(() => setMenuShown(false))
  }
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  })

  const handleDelete = useCallback(async () => {
    if (user?.userId !== authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/reviews?ReviewId=${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setServer(Response.ok)
        closeMenu()
        router.replace(`/`)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, authorId, reviewId, closeMenu])

  const handleNotifications = useCallback(async () => {
    if (user?.userId !== authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/reviews/notifs?ReviewId=${reviewId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setServer({ result: 201, message: notifsOnLocal ? 'You will no longer recieve notifications for this review!' : 'You will now recieve notifications for this review!' })
        setNotifsOnLocal(prev => !prev)
        onNotifChange()
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, authorId, notifsOnLocal, reviewId, onNotifChange])

  const handleEdit = useCallback(async () => {
    if (user?.userId !== authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    closeMenu()
    router.push(`review/alter/${filmId}`)
  }, [user, authorId, filmId, router, closeMenu])

  const handleReport = useCallback(async () => {
    if (user?.userId === authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/reviews/report?ReviewId=${reviewId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setServer({ result: 201, message: 'Review reported.' })
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, authorId, reviewId])

  useEffect(() => {
    setNotifsOnLocal(notifsOnInitial)
  }, [notifsOnInitial])

  const widescreen = useMemo((() => width > 1000), [width])

  return (
    <View>
      <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
        <More width={18} height={18} />
      </Pressable>
      <SlidingMenu
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        {
          user?.userId !== authorId ? (
            <Pressable style={styles.option} onPress={handleReport}>
              <HText style={styles.optionText}>Report Review </HText>
              <Flag height={20} width={20} />
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.option} onPress={handleEdit}>
                <HText style={styles.optionText}>Edit Review </HText>
                <Edit width={20} height={20} />
              </Pressable>
              {
                notifsOnLocal ? (
                  <Pressable style={styles.option} onPress={handleNotifications}>
                    <HText style={styles.optionText}>{'Turn Notifications Off '}</HText>
                    <NotifOff width={20} height={20} fill={Colors.text} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.option} onPress={handleNotifications}>
                    <HText style={styles.optionText}>{'Turn Notifications On '}</HText>
                    <Notif width={20} height={20} fill={Colors.text} />
                  </Pressable>
                )
              }
              <Pressable style={styles.option} onPress={handleDelete}>
                <HText style={styles.optionText}>Delete Review </HText>
                <Trash height={18} width={18} />
              </Pressable>
            </>
          )
        }

        <LoadingResponse visible={server.result === 0} />
        <Snackbar
          visible={[201, 403, 404, 500].includes(server.result)}
          onDismiss={() => setServer(Response.initial)}
          duration={3000}
          style={{
            backgroundColor: Colors.card,
            width: widescreen ? width*0.5 : width*0.9,
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
    </View>
  )
}

export default ReviewOptionsButton

const styles = StyleSheet.create({
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  }
})
