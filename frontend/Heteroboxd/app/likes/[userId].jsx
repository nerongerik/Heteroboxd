import { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Popup from '../../components/popup'
import LikeTabs from '../../components/tabs/likeTabs'

const PAGE_SIZE = 20

const UserLikes = () => {
  const { userId } = useLocalSearchParams()
  const [ reviews, setReviews ] = useState({ items: [], totalCount: 0, page: 1 })
  const [ lists, setLists ] = useState({ items: [], totalCount: 0, page: 1 })
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()
  const navigation = useNavigation()
  const requestRef = useRef(0)
  const loadingRef = useRef(false)
  const [ isRefreshing, setIsRefreshing ] = useState(false)

  const loadData = useCallback(async (pages = {}, fromRefresh = false) => {
    if (fromRefresh) setIsRefreshing(false)
    setServer(Response.loading)
    try {
      const params = new URLSearchParams({ ReviewsPage: pages.reviews || 1, ListsPage: pages.lists || 1, PageSize: PAGE_SIZE })
      if (loadingRef.current) return
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(`${BaseUrl.api}/users/likes?UserId=${userId}&${params}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (pages.reviews === 0) {
          console.log('reviews sleeping')
        } else if (!pages.reviews || pages.reviews === 1) {
          setReviews({ page: json.likedReviews.page, items: json.likedReviews.items, totalCount: json.likedReviews.totalCount })
        } else {
          setReviews(prev => ({...prev, page: json.likedReviews.page, items: prev.items.length > 250 ? [...prev.items.slice(-230), ...json.likedReviews.items] : [...prev.items, ...json.likedReviews.items]}))
        }
        if (pages.lists === 0) {
          console.log('lists sleeping')
        } else if (!pages.lists || pages.lists === 1) {
          setLists({ page: json.likedLists.page, items: json.likedLists.items, totalCount: json.likedLists.totalCount })
        } else {
          setLists(prev => ({...prev, page: json.likedLists.page, items: prev.items.length > 250 ? [...prev.items.slice(-230), ...json.likedLists.items] : [...prev.items, ...json.likedLists.items]}))
        }
        setServer(Response.ok)
      } else if (res.status === 404) {
        if (requestId !== requestRef.current) return
        setServer(Response.notFound)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    } finally {
      loadingRef.current = false
    }
  }, [userId])

  const loadPage = useCallback((tab, page) => {
    loadData({reviews: tab === 'reviews' ? page : 0, lists: tab === 'lists' ? page : 0})
  }, [loadData])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Likes',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'}
    })
  }, [navigation])

  useEffect(() => {
    loadData()
  }, [userId, loadData])

  return (
    <>
    <Head>
      <title>Likes</title>
      <meta name="description" content="Recently liked reviews and lists." />
      <meta property="og:title" content="Likes" />
      <meta property="og:description" content="Recently liked reviews and lists." />
      <link rel="icon" href="/favicon.ico" sizes="any" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <LikeTabs
        reviews={reviews}
        lists={lists}
        onPageChange={loadPage}
        router={router}
        pageSize={PAGE_SIZE}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true)
          loadData({reviews: 1, lists: 1}, true)
        }}
        loading={server.result <= 0}
      />

      <Popup
        visible={[404, 500].includes(server.result)}
        message={server.message}
        onClose={() => { server.result === 404 ? router.back() : router.replace('/contact') }}
      />
    </View>
    </>
  )
}

export default UserLikes