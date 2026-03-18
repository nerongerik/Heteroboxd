import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Fontisto from '@expo/vector-icons/Fontisto'
import { useNavigation, useRouter } from 'expo-router'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Author from '../../components/author'
import FilterSort from '../../components/filterSort'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import PaginationBar from '../../components/paginationBar'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 20

const ExploreLists = () => {
  const { user } = useAuth()
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'POPULARITY', desc: true })
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, lists: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const listRef = useRef(null)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]

  const translateY = slideAnim.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu = useCallback(() => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }, [slideAnim])
  const closeMenu = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const loadDataPage = useCallback(async (page) => {
    setServer(Response.loading)
    try {
      const url = user
      ? `${BaseUrl.api}/lists/all?UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      : `${BaseUrl.api}/lists/all?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, lists: json.items, totalCount: json.totalCount })
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, currentFilter, currentSort])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Featured Lists',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name='options' size={24} color={Colors.text} />
        </Pressable>
      )
    })
  }, [navigation, widescreen, openMenu])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])
  const spacing = useMemo(() => widescreen ? 30 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 800 : width * 0.9, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])

  const List = useCallback(({ item }) => (
    <View style={[styles.card, {marginBottom: 5}]}>
      <View style={{marginLeft: 5, marginBottom: -5}}>
        <Author
          userId={item.authorId}
          url={item.authorPictureUrl || null}
          username={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <HText style={[styles.listTitle, {fontSize: widescreen ? 20 : 16}]}>{format.sliceText(item.name || '', widescreen ? 80 : 40)}</HText>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {
            item.films.map((film, i) => (
              film ? (
                <Poster
                  key={film.filmId}
                  posterUrl={film.filmPosterUrl || 'noposter'}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2,
                    borderWidth: 2,
                    borderColor: Colors.border_color,
                    borderRadius: 6
                  }}
                />
              ) : (
                <View
                  key={`placeholder-${i}`}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2
                  }}
                />
              )
            ))
          }
        </View>
        <HText style={[styles.description, {fontSize: widescreen ? 16 : 14}]}>
          {format.sliceText(item.description || '', widescreen ? 500 : 150)}
        </HText>
        <View style={styles.statsRow}>
          <Fontisto name='nav-icon-list-a' size={widescreen ? 16 : 12} color={Colors._heteroboxd} />
          <HText style={[styles.statText, {color: Colors._heteroboxd, fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.listEntryCount)} </HText>
          <Fontisto name='heart' size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
          <HText style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, spacing, posterHeight, posterWidth, router])

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
        data={data.lists}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={server.result > 0 && <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</HText>}
        renderItem={List}
        ListFooterComponent={Footer}
        contentContainerStyle={{width: maxRowWidth, paddingBottom: 80, marginTop: 40, alignSelf: 'center'}}
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
          context={'exploreLists'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  )
}

export default ExploreLists

const styles = StyleSheet.create({
  card: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.border_color,
    borderRadius: 6,
    backgroundColor: Colors.card,
    padding: 1
  },
  listTitle: {
    color: Colors.text_title,
    fontWeight: '500',
    padding: 10,
  },
  description: {
    color: Colors.text,
    padding: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statText: {
    marginHorizontal: 4,
    fontWeight: 'bold',
    color: Colors.heteroboxd,
  }
})