import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, useWindowDimensions, View } from 'react-native'
import Filter from '../../../assets/icons/filter.svg'
import Shuffle from '../../../assets/icons/shuffle.svg'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../../helpers/auth'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 20

const Watchlist = () => {
  const { userId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [ server, setServer ] = useState(Response.initial)
  const [ data, setData ] = useState({ page: 1, entries: [], totalCount: 0 })
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'DATE ADDED', desc: true })
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const listRef = useRef(null)
  const requestRef = useRef(0)
  const loadingRef = useRef(false)

  const translateY = slideAnim.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu = useCallback(() => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [slideAnim])
  const closeMenu = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const loadDataPage = useCallback(async (page) => {
    if (user?.userId !== userId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      if (loadingRef.current) return
      const jwt = await auth.getJwt()
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(`${BaseUrl.api}/users/watchlist?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, entries: json.items, totalCount: json.totalCount })
        } else {
          setData(prev => ({...prev, page: json.page, entries: prev.entries.length > 1000 ? [...prev.entries.slice(-980), ...json.items] : [...prev.entries, ...json.items]}))
        }
        setServer(Response.ok)
        loadingRef.current = false
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
        loadingRef.current = false
      }
    } catch {
      setServer(Response.networkError)
      loadingRef.current = false
    }
  }, [user, userId, currentFilter, currentSort])

  const shuffle = useCallback(async () => {
    if (user?.userId !== userId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/shuffle?PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, entries: json.items, totalCount: json.totalCount })
        setServer(Response.ok)
      } else {
        loadDataPage(1)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, userId, loadDataPage])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage])

  const handleDelete = useCallback(async (filmId) => {
    if (user?.userId !== userId || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const prevEntries = data.entries
    const prevCount = data.totalCount
    setData(prev => ({...prev, entries: prev.entries.filter(e => e?.filmId !== filmId), totalCount: prev.totalCount - 1}))
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/watchlist?FilmId=${filmId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (!res.ok) {
        setData(prev => ({ ...prev, entries: prevEntries, totalCount: prevCount }))
        setServer(Response.internalServerError)
      }
    } catch {
      setData(prev => ({ ...prev, entries: prevEntries, totalCount: prevCount }))
      setServer(Response.networkError)
    }
  }, [user, userId, data.entries, data.totalCount])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Watchlist',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <>
          <Pressable onPress={shuffle}>
            <Shuffle width={22} height={22} />
          </Pressable>
          <Pressable onPress={openMenu} style={{marginLeft: 15, marginRight: widescreen ? 15 : null}}>
            <Filter width={22} height={22} />
          </Pressable>
        </>
      ),
    })
  }, [navigation, widescreen, openMenu, shuffle])

  useEffect(() => {
    loadDataPage(1)
  }, [userId, loadDataPage])

  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const Header = useMemo(() => (
    <>
      {
        user?.userId === userId && 
        <>
        <HText style={{color: Colors.text, fontSize: widescreen ? 16 : 13, textAlign: 'center'}}>Tip: to remove a film from your watchlist quickly, just press and hold on it!</HText>
        <View style={{height: 35}} />
        </>
      }
    </>
  ), [user, userId, widescreen])

  const Film = useCallback(({ item }) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    return (
      <Pressable onPress={() => router.push(`/film/${item.filmId}`)} onLongPress={() => {handleDelete(item.filmId)}} style={{margin: spacing / 2}}>
        <Poster
          posterUrl={item.filmPosterUrl || 'noposter'}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: Colors.border_color
          }}
        />
      </Pressable>
    )
  }, [posterWidth, posterHeight, spacing, router, handleDelete])

  const Footer = useMemo(() => data.entries.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.entries.length, server])

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={data.entries}
        keyExtractor={(item, index) => item ? item.id.toString() : `placeholder-${index}`}
        numColumns={4}
        ListEmptyComponent={server.result > 0 && <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</HText>}
        ListHeaderComponent={Header}
        renderItem={Film}
        ListFooterComponent={Footer}
        style={{alignSelf: 'center'}}
        columnWrapperStyle={{justifyContent: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
      />
      
      <LoadingResponse visible={data.entries.length === 0 && server.result <= 0} />
      <Popup
        visible={[403, 500].includes(server.result)}
        message={server.message}
        onClose={() => server.result === 403 ? router.replace('/login') : router.replace('/contact')}
      />

      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'watchlist'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  )
}

export default Watchlist