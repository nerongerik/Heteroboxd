import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Pressable, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import PaginationBar from '../../../components/paginationBar'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 20

const UserWatchedFilms = () => {
  const { userId } = useLocalSearchParams()
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ server, setServer ] = useState(Response.initial)
  const [ data, setData ] = useState({ page: 1, entries: [], totalCount: 0})
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'DATE WATCHED', desc: true })
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const listRef = useRef(null)

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
      const res = await fetch(`${BaseUrl.api}/films/user?UserId=${userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
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

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Recents',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name='options' size={24} color={Colors.text} />
        </Pressable>
      ),
    })
  }, [navigation, widescreen, openMenu])

  useEffect(() => {
    loadDataPage(1)
  }, [userId, loadDataPage])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])

  const Film = useCallback(({item}) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    return (
      <Pressable onPress={() => router.push(`/film/${item.id}`)} style={{margin: spacing / 2}}>
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

  const Footer = useMemo(() => (
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
  ), [data.page, totalPages, loadDataPage])

  return (
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
        columnWrapperStyle={{justifyContent: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80, marginTop: 50}}
        showsVerticalScrollIndicator={false}
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