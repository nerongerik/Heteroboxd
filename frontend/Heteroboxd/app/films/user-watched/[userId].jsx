import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, useWindowDimensions, View, RefreshControl } from 'react-native'
import Filter from '../../../assets/icons/filter.svg'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'
import { useAuth } from '../../../hooks/useAuth'
import Interact from '../../../components/interact'

const PAGE_SIZE = 20

const UserWatchedFilms = () => {
  const { userId } = useLocalSearchParams()
  const { user } = useAuth()
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ server, setServer ] = useState(Response.initial)
  const [ data, setData ] = useState({ page: 1, entries: [], totalCount: 0})
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'DATE WATCHED', desc: true })
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const [ menuShown2, setMenuShown2 ] = useState(false)
  const slideAnim2 = useState(new Animated.Value(0))[0]
  const listRef = useRef(null)
  const requestRef = useRef(0)
  const loadingRef = useRef(false)
  const [ selected, setSelected ] = useState(null)
  const [ isRefreshing, setIsRefreshing ] = useState(false)

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

  const translateY2 = slideAnim2.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu2 = useCallback((id) => {
    if (!user) return
    setSelected(id)
    setMenuShown2(true)
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [user, slideAnim2])
  const closeMenu2 = useCallback(() => {
    setSelected(null)
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown2(false))
  }, [slideAnim2])

  const loadDataPage = useCallback(async (page, fromRefresh = false) => {
    setServer(Response.loading)
    try {
      if (fromRefresh) setIsRefreshing(false)
      if (loadingRef.current) return
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(`${BaseUrl.api}/films/user?UserId=${userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, entries: json.items, totalCount: json.totalCount })
        } else {
          setData(prev => ({...prev, page: json.page, entries: prev.entries.length > 1000 ? [...prev.entries.slice(-980), ...json.items] : [...prev.entries, ...json.items]}))
        }
        setServer(Response.ok)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    } finally {
      loadingRef.current = false
    }
  }, [userId, currentFilter, currentSort])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Recents',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Filter width={22} height={22} />
        </Pressable>
      ),
    })
  }, [navigation, widescreen, openMenu])

  useEffect(() => {
    loadDataPage(1)
  }, [userId, loadDataPage])

  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])

  const Film = useCallback(({item}) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    return (
      <Pressable
        onPress={() => router.push(`/film/${item.id}`)}
        onLongPress={() => openMenu2(item.id)}
        style={{margin: spacing / 2}}
      >
        <Poster
          posterUrl={item.posterUrl || 'noposter'}
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
  }, [posterWidth, posterHeight, spacing, router])

  const Footer = useMemo(() => data.entries.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.entries.length, server])

  return (
    <>
    <Head>
      <title>Recents</title>
      <meta name="description" content="Recently watched films." />
      <meta property="og:title" content="Recents" />
      <meta property="og:description" content="Recently watched films." />
      <link rel="icon" href="/favicon.ico" sizes="any" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={data.entries}
        keyExtractor={(item, index) => item ? item.id.toString() : `placeholder-${index}`}
        numColumns={4}
        ListEmptyComponent={server.result > 0 && <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</HText>}
        renderItem={Film}
        ListFooterComponent={Footer}
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80, marginTop: 50}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setData({ page: 1, entries: [], totalCount: 0 })
              setIsRefreshing(true)
              loadDataPage(1, true)
            }}
          />
        }
      />

      <SlidingMenu
        menuShown={menuShown2}
        closeMenu={closeMenu2}
        translateY={translateY2}
        widescreen={widescreen}
        width={width}
      >
        <Interact
          widescreen={widescreen}
          filmId={selected}
          close={closeMenu2}
          fade={() => setData(prev => ({...prev, entries: prev.entries.filter(e => e?.id !== selected), totalCount: prev.totalCount - 1}))}
          del={() => {}}
        />
      </SlidingMenu>

      <LoadingResponse visible={data.entries.length === 0 && server.result <= 0} />
      <Popup visible={server.result === 500} message={server.message} onClose={() => router.replace('/contact')} />
    
      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'userWatched'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {closeMenu(); setData({ page: 1, entries: [], totalCount: 0 }); setCurrentFilter(newFilter)}}
          currentSort={currentSort}
          onSortChange={(newSort) => {closeMenu(); setData({ page: 1, entries: [], totalCount: 0 }); setCurrentSort(newSort)}}
        />
      </SlidingMenu> 
    </View>
    </>
  )
}

export default UserWatchedFilms