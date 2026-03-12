import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useRouter } from 'expo-router'
import * as auth from '../helpers/auth'
import * as format from '../helpers/format'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import LoadingResponse from '../components/loadingResponse'
import PaginationBar from '../components/paginationBar'
import Popup from '../components/popup'

const PAGE_SIZE = 24

const Notifications = () => {
  const { user, isValidSession } = useAuth()
  const [ data, setData ] = useState({ page: 1, notifs: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const [ isRefreshing, setIsRefreshing ] = useState(false)
  const router = useRouter()
  const { width } = useWindowDimensions()

  const loadDataPage = useCallback(async (page, fromRefresh = false) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      if (fromRefresh) setIsRefreshing(false)
      setServer(Response.loading)
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications?Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, notifs: json.items, totalCount: json.totalCount })
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user])

  const handleReadAll = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        loadDataPage(data.page)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, data])

  const handleNotifRead = useCallback(async (i) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${data.notifs[i]?.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        loadDataPage(data.page)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, data])

  const handleNotifDelete = useCallback(async (i) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${data.notifs[i]?.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        loadDataPage(data.page)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, data])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE)
  const maxRowWidth = useMemo(() => Math.min(1000, width*0.95), [width])

  const Header = () => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      {
        data.totalCount > 0 &&
        <Text style={{color: Colors.text, padding: 30, textAlign: 'center', fontSize: 14}}>
          Tip: to delete a notification for good, you can just press and hold on it!
        </Text>
      }
      <View style={{height: 20}} />
    </View>
  )

  const Notif = ( {item, index} ) => {
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
        <Text style={{color: item.read ? Colors.text : Colors.text_title, textAlign: 'left', fontSize: 14, width: '75%'}}>{item.text}</Text>
        <Text style={{color: item.read ? Colors.text : Colors.text_title, textAlign: 'center', fontSize: 12, marginRight: 10}}>{format.parseDateShort(item.date)}</Text>
      </Pressable>
    )
  }

  const Footer = () => (
    <PaginationBar
      page={data.page}
      totalPages={totalPages}
      onPagePress={(num) => {
        loadDataPage(num)
      }}
    />
  )
  
  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', paddingBottom: 50}}>
      <FlatList
        data={data.notifs}
        keyExtractor={item => item.id}
        ListHeaderComponent={Header}
        renderItem={Notif}
        ListEmptyComponent={<Text style={{padding: 15, textAlign: 'center', fontSize: 16, color: Colors.text}}>You have no notifications.</Text>}
        ListFooterComponent={Footer}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setIsRefreshing(true)
              loadDataPage(data.page, true)
            }} 
          />
        }
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: 10, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
      />

      { data.totalCount > 0 &&
        <View style={{position: 'absolute', bottom: 75, backgroundColor: Colors._heteroboxd, borderRadius: 5, padding: 7.5}}>
          <Pressable onPress={handleReadAll} style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: Colors.text_button, fontWeight: 'bold', fontSize: 14}}>MARK ALL AS READ </Text>
            <MaterialIcons name='mark-email-read' size={18} color={Colors.text_button} />
          </Pressable>
        </View>
      }

      <LoadingResponse visible={server.result <= 0} />
      <Popup
        visible={[403, 500].includes(server.response)}
        message={server.message}
        onClose={() => server.response === 403 ? router.replace('/login') : router.replace('/contact')}
      />
    </View>
  )
}

export default Notifications