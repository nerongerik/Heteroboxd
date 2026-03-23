import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, useWindowDimensions, View } from 'react-native'
import Seen from '../assets/icons/seen.svg'
import { useNavigation, useRouter } from 'expo-router'
import * as auth from '../helpers/auth'
import * as format from '../helpers/format'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'
import LoadingResponse from '../components/loadingResponse'
import Popup from '../components/popup'

const PAGE_SIZE = 20

const Notifications = () => {
  const { user, isValidSession } = useAuth()
  const [ data, setData ] = useState({ page: 1, notifs: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const [ isRefreshing, setIsRefreshing ] = useState(false)
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const requestRef = useRef(0)

  const loadDataPage = useCallback(async (page, fromRefresh = false) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      if (fromRefresh) setIsRefreshing(false)
      setServer(Response.loading)
      const jwt = await auth.getJwt()
      const requestId = ++requestRef.current
      const res = await fetch(`${BaseUrl.api}/notifications?Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, notifs: json.items, totalCount: json.totalCount })
        } else {
          setData(prev => ({...prev, page: json.page, notifs: prev.notifs.length > 1000 ? [...prev.notifs.slice(-980), ...json.items] : [...prev.notifs, ...json.items]}))
        }
        setServer(Response.ok)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user])

  const handleReadAll = useCallback(async () => {
    if (!user || !(await isValidSession())) return setServer(Response.forbidden)
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        loadDataPage(1)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, loadDataPage])

  const handleNotifRead = useCallback(async (i) => {
    if (!user || !(await isValidSession())) return setServer(Response.forbidden)
    const notif = data.notifs[i]
    setData(prev => ({...prev, notifs: prev.notifs.map((n, idx) => idx === i ? { ...n, read: true } : n)}))
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${notif?.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (!res.ok) {
        setData(prev => ({...prev, notifs: prev.notifs.map((n, idx) => idx === i ? notif : n)}))
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, data])

  const handleNotifDelete = useCallback(async (i) => {
    if (!user || !(await isValidSession())) return setServer(Response.forbidden)
    const notif = data.notifs[i]
    setData(prev => ({...prev, notifs: prev.notifs.filter((_, idx) => idx !== i), totalCount: prev.totalCount - 1}))
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${notif?.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (!res.ok) {
        setData(prev => ({...prev, notifs: [...prev.notifs.slice(0, i), notif, ...prev.notifs.slice(i)], totalCount: prev.totalCount + 1}))
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, data])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages && server.result !== 0) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage, server.result])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Notifications',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'}
    })
  }, [navigation])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const maxRowWidth = useMemo(() => Math.min(1000, width*0.95), [width])

  const Header = useMemo(() => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      {
        data.totalCount > 0 &&
        <HText style={{color: Colors.text, padding: 30, textAlign: 'center', fontSize: width > 1000 ? 18 : 14}}>
          Tip: to delete a notification for good, you can just press and hold on it!
        </HText>
      }
      <View style={{height: 20}} />
    </View>
  ), [maxRowWidth, data.totalCount, width])

  const Notif = useCallback(({item, index}) => {
    return (
      <Pressable
        style={{
          backgroundColor: item.read ? Colors.background : Colors.card,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          paddingVertical: 15,
          width: maxRowWidth,
          borderRadius: 3,
          borderWidth: 1,
          borderColor: Colors.border_color
        }}
        onPress={item.read ? null : () => handleNotifRead(index)}
        onLongPress={() => handleNotifDelete(index)}
      >
        <View style={{flexShrink: 0, backgroundColor: item.read ? 'transparent' : Colors.heteroboxd, width: 15, height: 15, borderRadius: 999, marginLeft: 10}} />
        <HText style={{color: item.read ? Colors.text : Colors.text_title, textAlign: 'left', fontSize: 14, width: '75%'}}>{item.text}</HText>
        <HText style={{color: item.read ? Colors.text : Colors.text_title, textAlign: 'center', fontSize: 12, marginRight: 10}}>{format.parseDateShort(item.date)}</HText>
      </Pressable>
    )
  }, [handleNotifRead, handleNotifDelete, maxRowWidth])

  const Footer = useMemo(() => data.notifs.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.notifs.length, server])
  
  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', paddingBottom: 50}}>
      <FlatList
        data={data.notifs}
        keyExtractor={item => item.id}
        ListHeaderComponent={Header}
        renderItem={Notif}
        ListEmptyComponent={<HText style={{padding: 15, textAlign: 'center', fontSize: 16, color: Colors.text}}>You have no notifications.</HText>}
        ListFooterComponent={Footer}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setIsRefreshing(true)
              loadDataPage(1, true)
            }}
          />
        }
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: 10, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
      />

      { data.totalCount > 0 &&
        <View style={{position: 'absolute', bottom: 75, backgroundColor: Colors._heteroboxd, borderRadius: 5, padding: 7.5}}>
          <Pressable onPress={handleReadAll} style={{flexDirection: 'row', alignItems: 'center'}}>
            <HText style={{color: Colors.text_button, fontWeight: 'bold', fontSize: 14}}>MARK ALL AS READ </HText>
            <Seen width={20} height={20} />
          </Pressable>
        </View>
      }

      <LoadingResponse visible={data.notifs.length === 0 && server.result <= 0} />
      <Popup
        visible={[403, 500].includes(server.response)}
        message={server.message}
        onClose={() => server.response === 403 ? router.replace('/login') : router.replace('/contact')}
      />
    </View>
  )
}

export default Notifications