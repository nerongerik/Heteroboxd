import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import More from '../../assets/icons/more.svg'
import Flag from '../../assets/icons/flag.svg'
import Edit from '../../assets/icons/edit.svg'
import Trash from '../../assets/icons/trash.svg'
import Logout from '../../assets/icons/logout.svg'
import Block from '../../assets/icons/block.svg'
import Unblock from '../../assets/icons/unblock.svg'
import { useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import HText from '../htext'
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
      const res = await fetch(`${BaseUrl.api}/users`, {
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
  }, [user, handleLogout])
  
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
      const res = await fetch(`${BaseUrl.api}/users/report?UserId=${userId}`, {
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
      const res = await fetch(`${BaseUrl.api}/users/relationships?TargetId=${userId}&Action=block-unblock`, {
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
        {other ? (
          <>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={handleReport}>
              <HText style={styles.optionText}>Report User  </HText>
              <Flag width={20} height={20} />
            </Pressable>
            {
              blockedLocalCopy ? (
                <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={() => blocked ? handleBlock() : setBlockConfirm(true)}>
                  <HText style={styles.optionText}>Unblock user  </HText>
                  <Unblock width={20} height={20} />
                </Pressable>
              ) : (
                <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={() => blocked ? handleBlock() : setBlockConfirm(true)}>
                  <HText style={styles.optionText}>Block user  </HText>
                  <Block width={20} height={20} />
                </Pressable>
              )
            }
          </>
        ) : (
          <>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={handleEdit}>
              <HText style={styles.optionText}>Edit Profile  </HText>
              <Edit width={20} height={20} />
            </Pressable>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={handleLogout}>
              <HText style={styles.optionText}>Sign Out  </HText>
              <Logout width={22} height={22} />
            </Pressable>
            <Pressable style={[styles.option, {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}]} onPress={() => {setDeleteConfirm(true)}}>
              <HText style={styles.optionText}>Delete Profile  </HText>
              <Trash width={18} height={18} />
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

export default ProfileOptionsButton

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
