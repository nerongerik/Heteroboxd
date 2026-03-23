import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Author from '../../components/author'
import FilterSort from '../../components/filterSort'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import ListOptionsButton from '../../components/optionButtons/listOptionsButton'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 20

const List = () => {
  const { listId } = useLocalSearchParams()
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const { user, isValidSession } = useAuth()
  const [ server, setServer ] = useState(Response.initial)
  const [ base, setBase ] = useState(null)
  const [ data, setData ] = useState({ page: 1, entries: [], totalCount: 0, seenFilms: [], seenCount: 0 })
  const [ fadeSeen, setFadeSeen ] = useState(true)
  const [ descCollapsed, setDescCollapsed ] = useState(true)
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'POSITION', desc: false })
  const [ menuShown2, setMenuShown2 ] = useState(false)
  const slideAnim2 = useState(new Animated.Value(0))[0]
  const listRef = useRef(null)
  const listLocalCopyRef = useRef(null)
  const likeRequestRef = useRef(0)
  const requestRef = useRef(0)
  const seenFilmsRef = useRef(new Set())

  const translateY2 = slideAnim2.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu2 = useCallback(() => {
    setMenuShown2(true)
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [slideAnim2])
  const closeMenu2 = useCallback(() => {
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown2(false))
  }, [slideAnim2])

  const loadBaseData = useCallback(async () => {
    setServer(Response.loading)
    try {
      if (user?.userId) {
        const res = await fetch(`${BaseUrl.api}/lists?UserListId=${listId}&UserId=${user.userId}`)
        if (res.ok) {
          const json = await res.json()
          setBase({...json.list, iLiked: json.iLiked})
          setServer(Response.ok)
        } else if (res.status === 404) {
          setServer(Response.notFound)
          setBase({})
        } else {
          setServer(Response.internalServerError)
          setBase({})
        }
      } else {
        const res = await fetch(`${BaseUrl.api}/lists?UserListId=${listId}`)
        if (res.ok) {
          const json = await res.json()
          setBase({...json, iLiked: false})
          setServer(Response.ok)
        } else if (res.status === 404) {
          setServer(Response.notFound)
          setBase({})
        } else {
          setServer(Response.internalServerError)
          setBase({})
        }
      }
    } catch {
      setServer(Response.networkError)
      setBase({})
    }
  }, [user, listId])

  const loadDataPage = useCallback(async (page) => {
    setServer(Response.loading)
    try {
      const url = user
      ? `${BaseUrl.api}/lists/entries?UserListId=${listId}&UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      : `${BaseUrl.api}/lists/entries?UserListId=${listId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const requestId = ++requestRef.current
      const res = await fetch(url)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, entries: json.items, totalCount: json.totalCount, seenCount: json.seenCount || 0 })
          if (user) {
            seenFilmsRef.current = new Set(json.seen)
          }
        } else {
          setData(prev => ({...prev, page: json.page, entries: prev.entries.length > 1000 ? [...prev.entries.slice(-980), ...json.items] : [...prev.entries, ...json.items]}))
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
  }, [user, listId, currentFilter, currentSort])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages && server.result !== 0) {
      loadDataPage(data.page + 1)
    }
  }, [data.page, totalPages, loadDataPage, server.result])

  const handleLike = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const currentList = listLocalCopyRef.current
    setBase(prev => ({...prev, likeCount: Math.max(currentList.likeCount + (currentList.iLiked ? -1 : 1), 0), iLiked: !currentList.iLiked}))
    const requestId = ++likeRequestRef.current
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.userId,
          UserName: user.name,
          AuthorId: currentList.authorId,
          ReviewId: null,
          FilmTitle: null,
          ListId: listId,
          ListName: currentList.name,
          LikeChange: currentList.iLiked ? -1 : 1
        })
      })
      if (requestId !== likeRequestRef.current) return
      if (!res.ok) {
        console.log(`${res.status}: list like failed.`)
      }
    } catch {
      if (requestId !== likeRequestRef.current) return
      console.log('like list failed; network error.')
    }
  }, [user, likeRequestRef, listId])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    if (!base) return
    navigation.setOptions({
      headerRight: () => {
        return (
          <>
            {user && <ListOptionsButton listId={base.id} authorId={base.authorId} notifsOnInitial={base.notificationsOn} onNotifChange={() => setBase(prev => ({...prev, notificationsOn: !prev.notificationsOn}))} />}
            {
              !base.ranked && 
              <Pressable onPress={openMenu2} style={{marginLeft: user ? 15 : null, marginRight: widescreen ? 15 : null}}>
                <Ionicons name='options' size={24} color={Colors.text} />
              </Pressable>
            }
          </>
        )
      }
    })
  }, [navigation, user, widescreen, base, openMenu2])

  useEffect(() => {
    if (!base?.id) return
    loadDataPage(1)
  }, [base?.id, currentFilter, currentSort])

  useEffect(() => {
    listLocalCopyRef.current = base
  }, [base])

  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const Header = useMemo(() => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      <Author
        userId={base?.authorId}
        url={base?.authorPictureUrl || null}
        username={format.sliceText(base?.authorName || 'Anonymous', widescreen ? 50 : 25)}
        admin={base?.admin}
        router={router}
        widescreen={widescreen}
        dim={widescreen ? 40 : 30}
      />
      <HText style={[styles.title, {fontSize: widescreen ? 30 : 24, marginTop: widescreen ? 20 : 5, marginBottom: widescreen ? 20 : 10}]}>{base?.name || '[nameless list]'}</HText>
      <Pressable onPress={() => setDescCollapsed(prev => !prev)}>
        <HText style={[styles.desc, {fontSize: widescreen ? 18 : 14}]}>
          {format.sliceText(base?.description || '', descCollapsed ? 300 : -1)}
        </HText>
      </Pressable>
      <View style={[styles.metaRow, {marginTop: widescreen ? 40 : 20}]}>
        <Pressable onPress={handleLike} style={styles.likeRow}>
          <MaterialCommunityIcons
            name={base?.iLiked ? 'cards-heart' : 'cards-heart-outline'}
            size={widescreen ? 24 : 20}
            color={base?.iLiked ? Colors.heteroboxd : Colors.text}
          />
          <HText style={[styles.metaText, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(base?.likeCount)} likes</HText>
        </Pressable>
        <HText style={[styles.metaText, {fontSize: widescreen ? 18 : 14}]}>{`${data.totalCount || 'No'} entries`}</HText>
      </View>
      {
        user && server.result > 0 ? (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View />
          <Pressable onPress={() => setFadeSeen(prev => !prev)} style={{alignSelf: 'flex-end', paddingTop: 5}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="eye-outline" size={widescreen ? 22 : 18} color={Colors._heteroboxd} />
              <HText style={{ color: Colors._heteroboxd, fontSize: widescreen ? 18 : 16 }}> {format.roundSeen(data.seenCount, data.totalCount)}% seen</HText>
            </View>
          </Pressable>
        </View>
        ) : <View />
      }
      <View style={{height: 20}} />
    </View>
  ), [maxRowWidth, base, router, widescreen, descCollapsed, user, data, fadeSeen, handleLike])

  const Film = useCallback(({ item }) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    const isSeen = fadeSeen && seenFilmsRef.current.has(item.filmId)
    return (
      <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{ margin: spacing / 2 }}>
        <Poster
          posterUrl={item.filmPosterUrl || 'noposter'}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSeen ? Colors.heteroboxd : Colors.border_color,
            opacity: isSeen ? 0.3 : 1
          }}
        />
        {base?.ranked && (
          <View
            style={{
              width: widescreen ? 28 : 20,
              height: widescreen ? 28 : 20,
              borderRadius: 9999,
              backgroundColor: Colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -10,
              alignSelf: 'center'
            }}
          >
            <HText
              style={{
                color: Colors.text_title,
                fontSize: widescreen ? 12 : 8,
                fontWeight: 'bold',
                lineHeight: 18,
              }}
            >
              {item.position}
            </HText>
          </View>
        )}
      </Pressable>
    )
  }, [posterWidth, posterHeight, spacing, fadeSeen, router, widescreen, base?.ranked])

  const Footer = useMemo(() => data.entries.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.entries.length, server])

  if (!base) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={data.entries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={Header}
        renderItem={Film}
        ListFooterComponent={Footer}
        ListEmptyComponent={
          server.result === 0
          ? <View style={{padding: 50, alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>
          : <HText style={{textAlign: 'center', color: Colors.text, padding: 50, fontSize: widescreen ? 20 : 16}}>Nothing to see here.</HText>
        }
        style={{alignSelf: 'center'}}
        columnWrapperStyle={{justifyContent: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
      />

      <Popup
        visible={[403, 404, 500].includes(server.result)}
        message={server.message}
        onClose={() => server.result === 403 ? router.replace('/login') : server.result === 404 ? router.back() : router.replace('/contact')}
      />

      {
        !base?.ranked && (
          <SlidingMenu 
            menuShown={menuShown2} 
            closeMenu={closeMenu2} 
            translateY={translateY2} 
            widescreen={widescreen} 
            width={width}
          >
            <FilterSort
              context={'list'}
              currentSort={currentSort}
              onSortChange={(newSort) => setCurrentSort(newSort)}
            />
          </SlidingMenu>
        )
      }
    </View>
  )
}

export default List

const styles = StyleSheet.create({
  author: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 16
  },
  title: {
    color: Colors.text_title,
    fontWeight: '600',
    marginBottom: 6
  },
  desc: {
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaText: {
    color: Colors.text,
    fontWeight: 'bold',
    marginLeft: 4
  }
})
