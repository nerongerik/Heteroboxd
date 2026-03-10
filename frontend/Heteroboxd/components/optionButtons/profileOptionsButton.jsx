import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Octicons from '@expo/vector-icons/Octicons'
import { useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import LoadingResponse from '../loadingResponse'
import Popup from '../popup'
import SlidingMenu from '../slidingMenu'

const ProfileOptionsButton = ({ userId, blocked }) => {
  const { user, logout, isValidSession } = useAuth()
  const [ other, setOther ] = useState(false)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const [ server, setServer ] = useState(Response.initial)
  const [ deleteConfirm, setDeleteConfirm ] = useState(false)
  const [ blockConfirm, setBlockConfirm ] = useState(false)
  const [ blockedLocalCopy, setBlockedLocalCopy ] = useState(false)
  const router = useRouter()
  const { width } = useWindowDimensions()

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

  const handleLogout = useCallback(async () => {
    await logout(userId)
    router.replace('/')
  }, [userId, logout, router])

  const handleDelete = useCallback(async () => {
    if (user?.userId !== userId || !(await isValidSession)) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setDeleteConfirm(false)
        handleLogout()
      } else {
        console.log('delete failed; internal server error; straight up lying to the user and logging them out lol.')
        handleLogout()
      }
    } catch {
      console.log('delete failed; network error; straight up lying to the user and logging them out lol.')
      handleLogout()
    }
  }, [user, userId, handleLogout])
  
  const handleEdit = useCallback(() => {
    router.replace(`/profile/edit/${userId}`)
  }, [userId, router])

  const handleReport = useCallback(async () => {
    if (user?.userId === userId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/report/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setServer({ result: 201, message: 'User reported.' })
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, userId])
  
  const handleBlock = useCallback(async () => {
    if (user?.userId === userId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/relationships/${user.userId}/${userId}?Action=block-unblock`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setBlockConfirm(false)
        setServer({ result: 202, message: blockedLocalCopy ? 'User unblocked.' : 'User blocked.' })
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, userId, blockedLocalCopy])

  useEffect(() => {
    setBlockedLocalCopy(blocked)
  }, [blocked])

  useEffect(() => {
    setOther(user?.userId !== userId)
  }, [user, userId])

  const widescreen = useMemo((() => width > 1000), [width])

  return (
    <View>
      <Pressable onPress={openMenu}>
        <MaterialIcons name='more-vert' size={24} color={Colors.text} />
      </Pressable>
      <SlidingMenu
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        {other ? (
          <>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={handleReport}>
              <Text style={styles.optionText}>Report User  </Text>
              <Octicons name='report' size={18} color={Colors.text} />
            </Pressable>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={() => blocked ? handleBlock() : setBlockConfirm(true)}>
              <Text style={styles.optionText}>{blockedLocalCopy ? 'Unblock user  ' : 'Block user  '}</Text>
              <Entypo name={blockedLocalCopy ? 'lock-open' : 'block'} size={18} color={Colors.text} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={handleEdit}>
              <Text style={styles.optionText}>Edit Profile  </Text>
              <Feather name="edit" size={18} color={Colors.text} />
            </Pressable>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={handleLogout}>
              <Text style={styles.optionText}>Sign Out  </Text>
              <FontAwesome name="sign-out" size={18} color={Colors.text} />
            </Pressable>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={() => {setDeleteConfirm(true)}}>
              <Text style={styles.optionText}>Delete Profile  </Text>
              <AntDesign name="user-delete" size={18} color={Colors.text} />
            </Pressable>
          </>
        )}
      </SlidingMenu>
      
      <LoadingResponse visible={server.result === 0} />

      <Popup
        visible={[201, 202, 403, 404, 500].includes(server.result)}
        message={server.message}
        onClose={() => server.result === 201 ? setServer(Response.initial) : server.result === 202 ? router.replace('/') : server.result === 403 ? router.replace('/login') : server.result === 404 ? router.replace('/') : router.replace('/contact')}
      />

      <Popup
        visible={deleteConfirm}
        message={'This action cannot be undone, and you may be unable to make a new account with the same email until we finish processing the request. Are you sure you want to delete your account?'}
        onClose={() => setDeleteConfirm(false)}
        confirm={true}
        onConfirm={handleDelete}
      />

      <Popup
        visible={blockConfirm} 
        message={'Are you sure you want to block this user? Interactions will be disabled until you unblock their account.'}
        onClose={() => setBlockConfirm(false)} 
        confirm={true} 
        onConfirm={handleBlock}
      />
    </View>
  )
}

export default ProfileOptionsButton;

const styles = StyleSheet.create({
  option: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  }
})
