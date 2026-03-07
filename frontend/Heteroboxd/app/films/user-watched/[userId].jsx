import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import FilterSort from '../../../components/filterSort'
import LoadingResponse from '../../../components/loadingResponse'
import PaginationBar from '../../../components/paginationBar'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 24

const UserWatchedFilms = () => {
  const { userId } = useLocalSearchParams()
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ server, setServer ] = useState(Response.initial)
  const [ data, setData ] = useState({ page: 1, entries: [], totalCount: 0})
  const [ showPagination, setShowPagination ] = useState(false)
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'DATE WATCHED', desc: true })
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const listRef = useRef(null)

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
      const res = await fetch(`${BaseUrl.api}/films/user/${userId}?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, entries: json.items, totalCount: json.totalCount })
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId, currentFilter, currentSort])

  useEffect(() => {
    setCurrentSort({field: 'DATE WATCHED', desc: true})
  }, [currentFilter.field])

  useEffect(() => {
    loadDataPage(1)
  }, [userId, loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Recents',
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
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])
  const paddedEntries = useMemo(() => {
    const padded = [...data.entries]
    const remainder = padded.length % 4
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null)
      }
    }
    return padded
  }, [data.entries])

  const Film = ({item}) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    return (
      <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{margin: spacing / 2}}>
        <Poster
          posterUrl={item.posterUrl}
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
  }

  const Footer = () => (
    <PaginationBar
      page={data.page}
      totalPages={totalPages}
      visible={showPagination}
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
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={paddedEntries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListEmptyComponent={server.result > 0 && <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</Text>}
        renderItem={Film}
        ListFooterComponent={Footer}
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80, marginTop: 50}}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />

      <LoadingResponse visible={server.result <= 0} />
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
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu> 
    </View>
  )
}

export default UserWatchedFilms