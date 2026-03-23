import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, useWindowDimensions, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import FilterSort from '../../components/filterSort'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 20

const Explore = () => {
  const { user } = useAuth()
  const { filter, value } = useLocalSearchParams()
  const [ currentFilter, setCurrentFilter ] = useState((filter && value) ? { field: filter, value: value } : { field: 'ALL', value: null })
  const [currentSort, setCurrentSort] = useState({ field: 'RELEASE DATE', desc: true })
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, films: [], totalCount: 0 })
  const seenFilmsRef = useRef(new Set())
  const [ seenCount, setSeenCount ] = useState(0)
  const [ fadeSeen, setFadeSeen ] = useState(true)
  const [ server, setServer ] = useState(Response.initial)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const requestRef = useRef(0)

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
    setServer(Response.loading)
    try {
      const url = user
      ? `${BaseUrl.api}/films/all?UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      : `${BaseUrl.api}/films/all?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const requestId = ++requestRef.current
      const res = await fetch(url)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, films: json.items, totalCount: json.totalCount })
          if (user) {
            seenFilmsRef.current = new Set(json.seen)
            setSeenCount(json.seenCount)
          }
        } else {
          setData(prev => ({...prev, page: json.page, films: prev.films.length > 1000 ? [...prev.films.slice(-980), ...json.items] : [...prev.films, ...json.items]}))
          if (user) {
            json.seen.forEach(id => seenFilmsRef.current.add(id))
          }
        }
        setServer(Response.ok)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, currentFilter, currentSort])

  const shuffle = useCallback(async () => {
    setServer(Response.loading)
    try {
      const url = user
        ? `${BaseUrl.api}/films/shuffle?UserId=${user.userId}&PageSize=${PAGE_SIZE}`
        : `${BaseUrl.api}/films/shuffle?PageSize=${PAGE_SIZE}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, films: json.items, totalCount: json.items.length })
        seenFilmsRef.current = new Set(json.seen)
        setSeenCount(json.seenCount)
        setServer(Response.ok)
      } else {
        loadDataPage(1)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, loadDataPage])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages && server.result !== 0) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage, server.result])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Explore',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <>
          <Pressable onPress={shuffle}>
            <Ionicons name='shuffle-outline' size={24} color={Colors.text} />
          </Pressable>
          <Pressable onPress={openMenu} style={{marginLeft: 15, marginRight: widescreen ? 15 : null}}>
            <Ionicons name='options' size={24} color={Colors.text} />
          </Pressable>
        </>
      ),
    })
  }, [navigation, widescreen, openMenu, shuffle])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const Header = useMemo(() => (
    <>
      {
        server.result > 0 &&
        <View style={{width: maxRowWidth, alignSelf: 'center'}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10}}>
            <HText style={{color: Colors.text, fontSize: widescreen ? 16 : 13}}>Exploring {data.totalCount} films</HText>
            {
              user ? (
                <Pressable onPress={() => setFadeSeen(prev => !prev)}>
                  <View style={{padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialCommunityIcons name='eye-outline' size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
                    <HText style={{color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13}}> {format.roundSeen(seenCount, data.totalCount)}% seen</HText>
                  </View>
                </Pressable>
              ) : <View />
            }
          </View>
          <View style={{height: 20}} />
        </View>
      }
    </>
  ), [server, maxRowWidth, data.totalCount, user, seenCount, widescreen])

  const Film = useCallback(({item}) => {
    if (!item) {
      return (
        <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
      )
    }
    const isSeen = fadeSeen && seenFilmsRef.current.has(item.id)
    return (
      <Pressable onPress={() => router.push(`/film/${item.id}`)} style={{margin: spacing / 2}}>
        <Poster
          posterUrl={item.posterUrl || 'noposter'}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSeen ? Colors.heteroboxd : Colors.border_color,
            opacity: isSeen ? 0.3 : 1
          }}
        />
      </Pressable>
    )
  }, [posterWidth, posterHeight, spacing, fadeSeen, router])

  const Footer = useMemo(() => data.films.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.films.length, server])

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', paddingBottom: 50}}>
      <FlatList
        data={data.films}
        keyExtractor={(item, index) => item ? item.id.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={Header}
        renderItem={Film}
        ListEmptyComponent={server.result > 0 && <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>There are currently no films matching this criteria...</HText>}
        ListFooterComponent={Footer}
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
        columnWrapperStyle={{justifyContent: 'center'}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
      />

      <LoadingResponse visible={data.films.length === 0 && server.result <= 0} />
      <Popup
        visible={server.result === 500}
        message={server.message}
        onClose={() => router.replace('/contact')}
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
          context={'explore'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  )
}

export default Explore