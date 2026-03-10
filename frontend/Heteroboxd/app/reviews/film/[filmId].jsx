import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Fontisto from '@expo/vector-icons/Fontisto'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as format from '../../../helpers/format'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import Author from '../../../components/author'
import FilterSort from '../../../components/filterSort'
import LoadingResponse from '../../../components/loadingResponse'
import PaginationBar from '../../../components/paginationBar'
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

  const openMenu = () => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setMenuShown(false))
  }
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  })

  const loadDataPage = useCallback(async (page) => {
    setServer(Response.loading)
    try {
      if (user?.userId) {
        const res = await fetch(`${BaseUrl.api}/reviews/film-reviews/${filmId}?UserId=${user?.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
        if (res.ok) {
          const json = await res.json()
          setData({ page: json.reviews.page, reviews: json.reviews.items, totalCount: json.reviews.totalCount })
          setUwf(json.uwf)
          setServer(Response.ok)
        } else {
          setServer(Response.internalServerError)
        }
      } else {
        const res = await fetch(`${BaseUrl.api}/reviews/film-reviews/${filmId}?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
        if (res.ok) {
          const json = await res.json()
          setData({ page: json.page, reviews: json.items, totalCount: json.totalCount })
          setServer(Response.ok)
        } else {
          setServer(Response.internalServerError)
        }
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, filmId, currentFilter, currentSort])

  const revealSpoiler = useCallback((reviewId) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev)
      next.add(reviewId)
      return next
    })
  }, [revealedSpoilers])

  const isRevealed = useCallback((reviewId) => revealedSpoilers.has(reviewId), [revealedSpoilers])

  useEffect(() => {
    setCurrentSort({field: 'POPULARITY', desc: true})
  }, [currentFilter.field])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    const first = data.reviews[0]
    if (!first) return
    navigation.setOptions({
      headerTitle: `Reviews of ${first.filmTitle?.slice(0, 20)}${first.filmTitle?.length > 20 ? '...' : ''}`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name='options' size={24} color={Colors.text} />
        </Pressable>
      ),
    })
  }, [data, navigation, widescreen, openMenu])

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE)
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])

  const Review = ({ item }) => (
    <View style={{borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border_color, borderRadius: 6, backgroundColor: Colors.card, padding: 5, marginBottom: 5}}>
      <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Author
          userId={item.authorId}
          url={item.authorProfilePictureUrl}
          username={item.authorName}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
        />
        <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
      </View>
      <Pressable onPress={() => router.push(`/review/${item.id}`)}>
        {
          item.text?.length > 0 ?
            !item.spoiler || uwf || isRevealed(item.id) ? (
              <View style={{marginVertical: 7.5}}>
                <ParsedRead html={`${item.text.replace(/\n{3,}/g, '\n\n').trim().slice(0, 350)}${item.text.length > 350 ? '...' : ''}`} />
              </View>
            ) : (
            <Pressable onPress={() => revealSpoiler(item.id)}>
              <View style={{width: '95%', alignSelf: 'center', padding: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center'}}>
                <Ionicons name="warning-outline" size={widescreen ? 30 : 24} color={Colors.text} />
                <Text style={{color: Colors.text, fontSize: 16, textAlign: 'center'}}>This review contains spoilers.<Text style={{color: Colors.text_link}}> Read anyway?</Text></Text>
              </View>
            </Pressable>
            ) : <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center'}}>{item.authorName || 'User'} wrote no review regarding this film.</Text>
        }
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 3}}>
          <Fontisto name='heart' size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
          <Text style={{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12}}>{format.formatCount(item.likeCount)}</Text>
        </View>
      </Pressable>
    </View>
  )

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
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={data.reviews}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={server.result > 0 && <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</Text>}
        renderItem={Review}
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
          context={'filmReviews'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  )
}

export default FilmsReviews