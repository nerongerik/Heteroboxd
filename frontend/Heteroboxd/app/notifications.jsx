import { StyleSheet, Text, View, FlatList, RefreshControl, useWindowDimensions, TouchableOpacity, Pressable } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { BaseUrl } from '../constants/api'
import Popup from '../components/popup'
import LoadingResponse from '../components/loadingResponse'
import PaginationBar from '../components/paginationBar'
import { Colors } from '../constants/colors'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as auth from '../helpers/auth'
import * as format from '../helpers/format'

const PAGE_SIZE = 48

const Notifications = () => {
  const { user, isValidSession } = useAuth()

  const [notifs, setNotifs] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPagination, setShowPagination] = useState(false)

  const router = useRouter()
  const {width} = useWindowDimensions();

  const [response, setResponse] = useState(-1)
  const [message, setMessage] = useState("")

  const loadNotifsPage = async (pageNumber) => {
    const vS = await isValidSession()
    if (!user || !vS) {
      router.replace('/login')
      return
    }
    try {
      setIsLoading(true);
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${user.userId}?Page=${pageNumber}&PageSize=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      })
      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setNotifs(json.notifications)
      } else {
        setMessage('Something went wrong while fetching your notifications! Try again later.')
      }
      setResponse(res.status)
    } catch {
      setMessage('Network error! Please check your internet connection.')
      setResponse(500)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadNotifsPage(1)
  }, [user])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const maxRowWidth = useMemo(() => Math.min(1000, width*0.95), [width])

  const handleReadAll = async () => {
    const vS = await isValidSession();
    if (!user || !vS) {
      router.replace('/login')
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/all/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      })
      if (res.status === 200) {
        loadNotifsPage(page)
      } else {
        setMessage('Something went wrong. Please try again later.')
        setResponse(res.status)
      }
    } catch {
      setMessage('Network error! Please check your internet connection.')
      setResponse(500)
    }
  }

  const handleNotifRead = async (i) => {
    const vS = await isValidSession();
    if (!user || !vS) {
      router.replace('/login')
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${notifs[i]?.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      })
      if (res.status === 200) {
        loadNotifsPage(page)
      } else {
        setMessage('Something went wrong. Please try again later.')
        setResponse(res.status)
      }
    } catch {
      setMessage('Network error! Please check your internet connection.')
      setResponse(500)
    }
  }

  const handleNotifDelete = async (i) => {
    const vS = await isValidSession();
    if (!user || !vS) {
      router.replace('/login')
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/notifications/${notifs[i]?.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      })
      if (res.status === 200) {
        loadNotifsPage(page)
      } else {
        setMessage('Something went wrong. Please try again later.')
        setResponse(res.status)
      }
    } catch {
      setMessage('Network error! Please check your internet connection.')
      setResponse(500)
    }
  }

  const renderHeader = () => (
    <View style={{ width: maxRowWidth, alignSelf: 'center' }}>
      {
        totalCount > 0 &&
        <Text style={{color: Colors.text, padding: 30, textAlign: 'center', fontSize: 14}}>
          Tip: to delete a notification for good, you can just press and hold on it!
        </Text>
      }
      <View style={{ height: 20 }} />
    </View>
  )

  const renderContent = ({item, index}) => {
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
        <Text style={{color: item.read ? Colors.text : Colors.text_title, textAlign: 'left', fontSize: 14, width: '75%'}}>
          {item.text}
        </Text>
        <Text style={{color: item.read ? Colors.text : Colors.text_title, textAlign: 'center', fontSize: 12, marginRight: 10}}>
          {format.parseDateShort(item.date)}
        </Text>
      </Pressable>
    )
  }

  const renderFooter = () => (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      visible={showPagination}
      onPagePress={(num) => {
        setPage(num)
        loadNotifsPage(num)
      }}
    />
  )
  
  return (
    <View style={styles.container}>

      <FlatList
        data={notifs}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderContent}
        ListEmptyComponent={<Text style={{padding: 15, textAlign: 'center', fontSize: 16, color: Colors.text}}>You have no notifications.</Text>}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadNotifsPage(page)} />
        }
        style={{
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />

      { totalCount > 0 &&
        <View style={{position: 'absolute', bottom: 75, backgroundColor: Colors._heteroboxd, borderRadius: 5, padding: 7.5}}>
          <TouchableOpacity onPress={handleReadAll} style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: Colors.text_button, fontWeight: 'bold', fontSize: 14}}>MARK ALL AS READ </Text>
            <MaterialIcons name="mark-email-read" size={18} color={Colors.text_button} />
          </TouchableOpacity>
        </View>
      }

      <LoadingResponse visible={isLoading} />
      <Popup
        visible={![-1, 200].includes(response)}
        message={message}
        onClose={() =>
          response === 500
            ? router.replace('/contact')
            : router.replace('/')
        }
      />
    </View>
  )
}

export default Notifications

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingBottom: 50
  },
})