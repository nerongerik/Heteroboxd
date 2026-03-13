import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Octicons } from '@expo/vector-icons'
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

const ListOptionsButton = ({ listId, authorId, notifsOnInitial, onNotifChange }) => {
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
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/notifs?UserListId=${listId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setServer({ result: 201, message: notifsOnLocal ? 'You will no longer recieve notifications for this list!' : 'You will now recieve notifications for this list!' })
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
  }, [user, authorId, notifsOnLocal, listId, onNotifChange])

  const handleReport = useCallback(async () => {
    if (user?.userId === authorId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/report?UserListId=${listId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setServer({ result: 201, message: 'List reported.' })
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
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
  }, [notifsOnInitial])

  const widescreen = useMemo((() => width > 1000), [width])

  return (
    <View>
      <Pressable onPress={openMenu} style={{zIndex: 1}}>
        <MaterialIcons name='more-vert' size={24} color={Colors.text} />
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
              <Octicons name="report" size={18} color={Colors.text} />
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.option} onPress={handleEdit}>
                <HText style={styles.optionText}>Edit List </HText>
                <MaterialIcons name="edit" size={20} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.option} onPress={handleNotifications}>
                <HText style={styles.optionText}>{notifsOnLocal ? 'Turn Notifications Off ' : 'Turn Notifications On '}</HText>
                <MaterialIcons name={notifsOnLocal ? "notifications-off" : 'notifications-active'} size={20} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.option} onPress={handleDelete}>
                <HText style={styles.optionText}>Delete List </HText>
                <MaterialIcons name="delete-forever" size={20} color={Colors.text} />
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
