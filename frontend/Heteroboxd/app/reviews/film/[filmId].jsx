import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, useWindowDimensions, View, RefreshControl } from 'react-native'
import Spoiler from '../../../assets/icons/spoiler.svg'
import Heart from '../../../assets/icons/heart.svg'
import Filter from '../../../assets/icons/filter.svg'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import * as format from '../../../helpers/format'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import Author from '../../../components/author'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import ParsedRead from '../../../components/parsedRead'
import Popup from '../../../components/popup'
import Stars from '../../../components/stars'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 20

const FilmsReviews = () => {
  const { filmId } = useLocalSearchParams()
  const { user } = useAuth()
  const [ uwf, setUwf ] = useState(false)
  const [ revealedSpoilers, setRevealedSpoilers ] = useState(() => new Set())
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, reviews: [], totalCount: 0 })
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

  const loadDataPage = useCallback(async (page, fromRefresh = false) => {
    if (fromRefresh) setIsRefreshing(false)
    setServer(Response.loading)
    try {
      if (user?.userId) {
        if (loadingRef.current) return
        const requestId = ++requestRef.current
        loadingRef.current = true
        const res = await fetch(`${BaseUrl.api}/reviews/film?FilmId=${filmId}&UserId=${user?.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
        if (res.ok) {
          if (requestId !== requestRef.current) return
          const json = await res.json()
          if (page === 1) {
            setData({ page: json.reviews.page, reviews: json.reviews.items, totalCount: json.reviews.totalCount })
            setUwf(json.uwf)
          } else {
            setData(prev => ({...prev, page: json.reviews.page, reviews: prev.reviews.length > 1000 ? [...prev.reviews.slice(-980), ...json.reviews.items] : [...prev.reviews, ...json.reviews.items]}))
          }
          setServer(Response.ok)
        } else {
          if (requestId !== requestRef.current) return
          setServer(Response.internalServerError)
        }
      } else {
        if (loadingRef.current) return
        const requestId = ++requestRef.current
        loadingRef.current = true
        const res = await fetch(`${BaseUrl.api}/reviews/film?FilmId=${filmId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
        if (res.ok) {
          if (requestId !== requestRef.current) return
          const json = await res.json()
          if (page === 1) {
            setData({ page: json.page, reviews: json.items, totalCount: json.totalCount })
          } else {
            setData(prev => ({...prev, page: json.page, reviews: prev.reviews.length > 1000 ? [...prev.reviews.slice(-980), ...json.items] : [...prev.reviews, ...json.items]}))
          }
          setServer(Response.ok)
        } else {
          if (requestId !== requestRef.current) return
          setServer(Response.internalServerError)
        }
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

  const revealSpoiler = useCallback((reviewId) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev)
      next.add(reviewId)
      return next
    })
  }, [])

  const isRevealed = useCallback((reviewId) => revealedSpoilers.has(reviewId), [revealedSpoilers])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: `Film's Reviews`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Filter width={22} height={22} />
        </Pressable>
      ),
    })
  }, [navigation, widescreen, openMenu])

  const maxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])

  const Review = useCallback(({ item }) => (
    <View style={{borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border_color, borderRadius: 6, backgroundColor: Colors.card, padding: 5, marginBottom: 5}}>
      <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Author
          userId={item.authorId}
          url={item.authorPictureUrl || null}
          username={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
          dim={widescreen ? 40 : 30}
        />
        <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
      </View>
      <Pressable onPress={() => router.push(`/review/${item.id}`)}>
        {
          item.text?.length > 0 ?
            !item.spoiler || uwf || isRevealed(item.id) ? (
              <View style={{marginVertical: 7.5, overflow: 'hidden'}}>
                <ParsedRead html={`${format.sliceText(item.text.replace(/\n{2,}/g, '\n').trim(), widescreen ? 600 : 300)}`} contentWidth={maxRowWidth} />
              </View>
            ) : (
            <Pressable onPress={() => revealSpoiler(item.id)}>
              <View style={{width: '95%', alignSelf: 'center', padding: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center'}}>
                <Spoiler width={widescreen ? 30 : 24} height={widescreen ? 30 : 24} />
                <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>This review contains spoilers.{'\n'}<HText style={{color: Colors.text_link}}>Read anyway?</HText></HText>
              </View>
            </Pressable>
            ) : <HText style={{paddingVertical: 10, color: Colors.text, fontStyle: 'italic', fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>The author was left speechless.</HText>
        }
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 3}}>
          <Heart height={widescreen ? 16 : 12} width={widescreen ? 16 : 12} fill={Colors.heteroboxd} />
          <HText style={{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12}}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, router, uwf, isRevealed, revealSpoiler])

  const Footer = useMemo(() => data.reviews.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.reviews.length, server])

  return (
    <>
    <Head>
      <title>Film's Reviews</title>
      <meta name="description" content="Every review ever written for the selected film." />
      <meta property="og:title" content="Film's Reviews" />
      <meta property="og:description" content="Every review ever written for the selected film." />
      <link rel="icon" href="/favicon.ico" sizes="any" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={data.reviews}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={server.result > 0 && <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</HText>}
        renderItem={Review}
        ListFooterComponent={Footer}
        contentContainerStyle={{width: maxRowWidth, paddingBottom: 80, marginTop: 40, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => {
              setData({ page: 1, reviews: [], totalCount: 0 })
              setIsRefreshing(true)
              loadDataPage(1, true)
            }}
          />
        }
      />

      <LoadingResponse visible={data.reviews.length === 0 && server.result <= 0} />
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
          context={'filmReviews'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {closeMenu(); setData({ page: 1, reviews: [], totalCount: 0 }); setCurrentFilter(newFilter)}}
          currentSort={currentSort}
          onSortChange={(newSort) => {closeMenu(); setData({ page: 1, reviews: [], totalCount: 0 }); setCurrentSort(newSort)}}
        />
      </SlidingMenu>
    </View>
    </>
  )
}

export default FilmsReviews