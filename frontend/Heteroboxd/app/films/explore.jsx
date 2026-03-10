import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import FilterSort from '../../components/filterSort'
import LoadingResponse from '../../components/loadingResponse'
import PaginationBar from '../../components/paginationBar'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 24

const Explore = () => {
  const { user } = useAuth()
  const { filter, value } = useLocalSearchParams()
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [currentSort, setCurrentSort] = useState({ field: 'RELEASE DATE', desc: true })
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, films: [], totalCount: 0 })
  const [ seenFilms, setSeenFilms ] = useState([])
  const [ seenCount, setSeenCount ] = useState(0)
  const [ fadeSeen, setFadeSeen ] = useState(true)
  const [ server, setServer ] = useState(Response.initial)
  const listRef = useRef(null)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]

  const openMenu = () => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false))
  }
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  })

  const loadDataPage = useCallback(async (page) => {
    setServer(Response.loading)
    try {
      const url = user
        ? `${BaseUrl.api}/films?UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
        : `${BaseUrl.api}/films?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, films: json.items, totalCount: json.totalCount })
        setSeenFilms(json.seen)
        setSeenCount(json.seenCount)
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, currentFilter, currentSort])

  useEffect(() => {
    if (!filter || !value) return;
    setCurrentFilter({field: filter, value: value});
  }, [filter, value])

  useEffect(() => {
    if (currentFilter.field === 'POPULAR' || currentFilter.field === 'YEAR') {
      setCurrentSort({field: 'POPULARITY', desc: true})
    } else if (currentFilter.field === 'ALL' || currentFilter.field === 'GENRE' || currentFilter.field === 'COUNTRY') {
      setCurrentSort({field: 'RELEASE DATE', desc: true})
    }
  }, [currentFilter.field])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Explore',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name='options' size={24} color={Colors.text} />
        </Pressable>
      ),
    })
  }, [navigation, widescreen, openMenu])

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE)
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const paddedFilms = useMemo(() => {
    const padded = [...data.films]
    const remainder = padded.length % 4
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null)
      }
    }
    return padded
  }, [data.films])

  const Header = () => (
    <>
      {
        server.result > 0 &&
        <View style={{width: maxRowWidth, alignSelf: 'center'}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10}}>
            <Text style={{color: Colors.text, fontSize: widescreen ? 16 : 13}}>Exploring {data.totalCount} films</Text>
            {
              user ? (
                <Pressable onPress={() => setFadeSeen(prev => !prev)}>
                  <View style={{padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialCommunityIcons name='eye-outline' size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
                    <Text style={{color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13}}> {format.roundSeen(seenCount, data.totalCount)}% seen</Text>
                  </View>
                </Pressable>
              ) : <View />
            }
          </View>
          <View style={{height: 20}} />
        </View>
      }
    </>
  )

  const Film = ({item}) => {
    if (!item) {
      return (
        <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
      )
    }
    const isSeen = fadeSeen && (seenFilms?.includes(item.filmId) ?? false)
    return (
      <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{margin: spacing / 2}}>
        <Poster
          posterUrl={item.posterUrl}
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
  }

  const Footer = () => (
    <PaginationBar
      page={data.page}
      totalPages={totalPages}
      onPagePress={(num) => {
        loadDataPage(num)
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        })
      }}
    />
  )

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={paddedFilms}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={Header}
        renderItem={Film}
        ListEmptyComponent={server.result > 0 && <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>There are currently no films matching this criteria...</Text>}
        ListFooterComponent={Footer}
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
        columnWrapperStyle={{alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
      />

      <LoadingResponse visible={server.result <= 0} />
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