import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Fontisto from '@expo/vector-icons/Fontisto'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as format from '../../../helpers/format'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import Author from '../../../components/author'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import ParsedRead from '../../../components/parsedRead'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import Stars from '../../../components/stars'
import SlidingMenu from '../../../components/slidingMenu'
import { useAuth } from '../../../hooks/useAuth'

const PAGE_SIZE = 20

const UserReviews = () => {
  const { userId } = useLocalSearchParams()
  const { user } = useAuth()
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, reviews: [], totalCount: 0 })
  const [ author, setAuthor ] = useState({ authorPic: '', authorName: '', authorAdmin: false })
  const [ server, setServer ] = useState(Response.initial)
  const [ currentSort, setCurrentSort ] = useState({ field: 'DATE CREATED', desc: true })
  const listRef = useRef(null)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const requestRef = useRef(0)

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
      useNativeDriver: true,
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const loadDataPage = useCallback(async (page) => {
    setServer(Response.loading)
    try {
      const requestId = ++requestRef.current
      const res = await fetch(`${BaseUrl.api}/reviews/user?UserId=${userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=ALL&Sort=${currentSort.field}&Desc=${currentSort.desc}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, reviews: json.items, totalCount: json.totalCount })
          setAuthor({
            authorPic: json.items[0]?.authorPictureUrl || null,
            authorName: json.items[0]?.authorName || 'Anonymous',
            authorAdmin: json.items[0]?.admin || false
          })
        } else {
          setData(prev => ({...prev, page: json.page, reviews: prev.reviews.length > 1000 ? [...prev.reviews.slice(-980), ...json.items] : [...prev.reviews, ...json.items]}))
        }
        setServer(Response.ok)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId, currentSort])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages && server.result !== 0) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage, server.result])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: userId == user?.userId ? 'Your reviews' : `${author.authorName}'s reviews`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name='options' size={24} color={Colors.text} />
        </Pressable>
      )
    })
  }, [navigation, author, widescreen, openMenu])

  const maxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => widescreen ? 150 : 100, [widescreen])
  const posterHeight = useMemo(() => posterWidth*3/2, [posterWidth])
  const AuthorMemo = useMemo(() =>
    <Author
      userId={userId}
      url={author.authorPic}
      username={format.sliceText(author.authorName, widescreen ? 50 : 25)}
      admin={author.authorAdmin}
      router={router}
      widescreen={widescreen}
      dim={widescreen ? 40 : 30}
    />,
  [userId, author, router, widescreen])

  const Review = useCallback(({ item }) => (
    <View style={{borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border_color, borderRadius: 6, backgroundColor: Colors.card, padding: 5, marginBottom: 10}}>
      <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        {AuthorMemo}
        <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
      </View>
      <Pressable onPress={() => router.push(`/review/${item.id}`)}>
        <HText style={{padding: 5, flex: 1, flexWrap: 'wrap', fontWeight: '600', textAlign: 'left', fontSize: widescreen ? 20 : 16, color: Colors.text_title}}>{format.sliceText(item.filmTitle || '', widescreen ? 100 : 50)}</HText>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
          <View style={{width: posterWidth, height: posterHeight, marginRight: 5}}>
            <Poster
              posterUrl={item.filmPosterUrl || 'noposter'}
              style={{
                width: posterWidth,
                height: posterHeight,
                borderWidth: 2,
                borderRadius: 6,
                borderColor: Colors.border_color
              }}
            />
          </View>
          {
            item.text?.length > 0 ?
            <View style={{width: maxRowWidth - posterWidth - 10, maxHeight: posterHeight, overflow: 'hidden'}}>
              <ParsedRead html={`${format.sliceText(item.text.replace(/\n{2,}/g, '\n').trim(), widescreen ? 250 : 150)}`} contentWidth={maxRowWidth - posterWidth - 10} />
            </View>
            :
            <View style={{width: maxRowWidth - posterWidth - 10, marginLeft: -5}}>
              <HText style={{color: Colors.text, fontStyle: 'italic', fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>The author was left speechless.</HText>
            </View>
          }
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 3}}>
          <Fontisto name='heart' size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
          <HText style={{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12}}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, posterWidth, posterHeight, maxRowWidth, router, AuthorMemo])

  const Footer = useMemo(() => server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [server])

  return (
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
      />

      <LoadingResponse visible={data.page === 1 && server.result <= 0} />
      <Popup
        visible={server.result === 500}
        message={server.message}
        onClose={() => router.replace('/contact') }
      />

      <SlidingMenu
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <FilterSort
          context={'userReviews'}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  )
}

export default UserReviews