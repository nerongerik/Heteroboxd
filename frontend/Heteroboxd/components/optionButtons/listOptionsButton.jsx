import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Trash from '../../assets/icons/trash.svg'
import Flag from '../../assets/icons/flag.svg'
import More from '../../assets/icons/more.svg'
import Edit from '../../assets/icons/edit.svg'
import Notif from '../../assets/icons/notifications.svg'
import NotifOff from '../../assets/icons/notifications-off.svg'
import Pin from '../../assets/icons/pin.svg'
import Unpin from '../../assets/icons/unpin.svg'
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

const ListOptionsButton = ({ listId, authorId, notifsOnInitial, onNotifChange, pinnedInitial, onPin }) => {
  const { user, isValidSession } = useAuth()
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ notifsOnLocal, setNotifsOnLocal ] = useState(true)
  const [ pinnedLocal, setPinnedLocal ] = useState(false)
  const [ server, setServer ] = useState(Response.initial)

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
      useNativeDriver: true
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const handleDelete = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists?UserListId=${listId}`, {
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
  }, [user, router, listId, closeMenu])

  const handleNotifications = useCallback(async () => {
    if (user?.userId !== authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer({ result: 201, message: notifsOnLocal ? 'You will no longer recieve notifications for this list!' : 'You will now recieve notifications for this list!' })
    setNotifsOnLocal(prev => !prev)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/notifs?UserListId=${listId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        onNotifChange()
      } else if (res.status === 404) {
        console.log('notifs failed; not found')
      } else {
        console.log('notifs failed; internal server error')
      }
    } catch {
      console.log('notifs failed; network error')
    }
  }, [user, authorId, notifsOnLocal, listId, onNotifChange])

  const handlePin = useCallback(async () => {
    if (user?.userId !== authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer({ result: 201, message: pinnedLocal ? 'List unpinned from your profile!' : 'List pinned to your profile!' })
    setPinnedLocal(prev => !prev)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/pin?ObjectId=${listId}&Type=list`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        onPin()
      } else if (res.status === 400) {
        console.log('pin failed; bad request')
      } else if (res.status === 404) {
        console.log('pin failed; not found')
      } else {
        console.log('pin failed; internal server error')
      }
    } catch {
      console.log('pin failed; network error')
    }
  }, [user, authorId, pinnedLocal, listId, onPin])

  const handleReport = useCallback(async () => {
    if (user?.userId === authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer({ result: 201, message: 'List reported.' })
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/report?UserListId=${listId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.status === 404) {
        console.log('report failed; not found')
      } else if (!res.ok) {
        console.log('report failed; internal server error')
      }
    } catch {
      console.log('report failed; network error')
    }
  }, [user, authorId, listId])

  const handleEdit = useCallback(async () => {
    if (user?.userId !== authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    closeMenu()
    router.push(`list/edit/${listId}`)
  }, [user, authorId, listId, router, closeMenu])

  useEffect(() => {
    setNotifsOnLocal(notifsOnInitial)
    setPinnedLocal(pinnedInitial)
  }, [notifsOnInitial, pinnedInitial])

  const widescreen = useMemo((() => width > 1000), [width])

  return (
    <View>
      <Pressable onPress={openMenu} style={{zIndex: 999}}>
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
              <HText style={styles.optionText}>Report List </HText>
              <Flag width={20} height={20} />
            </Pressable>
          ) : (
            <>
              {
                pinnedLocal ? (
                  <Pressable style={styles.option} onPress={handlePin}>
                    <HText style={styles.optionText}>{'Unpin '}</HText>
                    <Unpin width={20} height={20} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.option} onPress={handlePin}>
                    <HText style={styles.optionText}>{'Pin '}</HText>
                    <Pin width={20} height={20} />
                  </Pressable>
                )
              }
              <Pressable style={styles.option} onPress={handleEdit}>
                <HText style={styles.optionText}>Edit List </HText>
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
                <HText style={styles.optionText}>Delete List </HText>
                <Trash width={18} height={18} />
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

export default ListOptionsButton

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
