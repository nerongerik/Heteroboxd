import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, useWindowDimensions, View, RefreshControl, Platform } from 'react-native'
import Filter from '../../../assets/icons/filter.svg'
import ListIco from '../../../assets/icons/list.svg'
import Heart from '../../../assets/icons/heart.svg'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as format from '../../../helpers/format'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import Author from '../../../components/author'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 20

const FilmsLists = () => {
  const { user } = useAuth()
  const { filmId } = useLocalSearchParams()
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, lists: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'POPULARITY', desc: true })
  const listRef = useRef(null)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const requestRef = useRef(0)
  const loadingRef = useRef(false)
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

  const loadDataPage = useCallback(async (page, fromRefresh = false) => {
    try {
      if (fromRefresh) setIsRefreshing(false)
      setServer(Response.loading)
      if (loadingRef.current) return
      const url = user
      ? `${BaseUrl.api}/lists/featuring?FilmId=${filmId}&UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      : `${BaseUrl.api}/lists/featuring?FilmId=${filmId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(url)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, lists: json.items, totalCount: json.totalCount })
        } else {
          setData(prev => ({...prev, page: json.page, lists: prev.lists.length > 250 ? [...prev.lists.slice(-230), ...json.items] : [...prev.lists, ...json.items]}))
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
  }, [user, filmId, currentFilter, currentSort])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Featuring film',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Filter height={22} width={22} />
        </Pressable>
      )
    })
    if (Platform.OS === 'web') {
      document.title = 'Featuring film'
    }
  }, [navigation, widescreen, openMenu])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

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
          dim={widescreen ? 40 : 30}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <HText style={[styles.listTitle, {fontSize: widescreen ? 20 : 16}]}>{format.sliceText(item.name || '', widescreen ? 80 : 40)}</HText>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
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
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2,
                  }}
                />
              )
            ))
          }
        </View>
        <HText style={[styles.description, {fontSize: widescreen ? 16 : 14}]}>
          {format.sliceText((item.description || '').replace(/\n{2,}/g, '\n'), widescreen ? 500 : 150)}
        </HText>
        <View style={styles.statsRow}>
          <ListIco height={widescreen ? 20 : 16} width={widescreen ? 20 : 16} />
          <HText style={[styles.statText, {color: Colors._heteroboxd, fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.listEntryCount)} </HText>
          <Heart height={widescreen ? 16 : 12} width={widescreen ? 16 : 12} fill={Colors.heteroboxd} />
          <HText style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, posterHeight, posterWidth, router, spacing])
  
  const Footer = useMemo(() => data.lists.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.lists.length, server])

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
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setData({ page: 1, lists: [], totalCount: 0 })
              setIsRefreshing(true)
              loadDataPage(1, true)
            }}
          />
        }
      />

      <LoadingResponse visible={data.lists.length === 0 && server.result <= 0} />
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
          context={'filmLists'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {closeMenu(); setData({ page: 1, lists: [], totalCount: 0 }); setCurrentFilter(newFilter)}}
          currentSort={currentSort}
          onSortChange={(newSort) => {closeMenu(); setData({ page: 1, lists: [], totalCount: 0 }); setCurrentSort(newSort)}}
        />
      </SlidingMenu>
    </View>
  )
}

export default FilmsLists

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
  },
})
