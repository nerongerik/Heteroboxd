import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import FilterSort from '../../components/filterSort'
import LoadingResponse from '../../components/loadingResponse'
import ListOptionsButton from '../../components/optionButtons/listOptionsButton'
import PaginationBar from '../../components/paginationBar'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 24

const List = () => {
  const { listId } = useLocalSearchParams()
  const router = useRouter()
  const navigation = useNavigation();
  const { width } = useWindowDimensions()
  const { user, isValidSession } = useAuth()
  const [ server, setServer ] = useState(Response.initial)
  const [ base, setBase ] = useState(null)
  const [ data, setData ] = useState({ page: 1, entries: [], totalCount: 0, seenFilms: [], seenCount: 0 })
  const [showPagination, setShowPagination] = useState(false)
  const [ fadeSeen, setFadeSeen ] = useState(true)
  const [ iLiked, setILiked ] = useState(false)
  const [ descCollapsed, setDescCollapsed ] = useState(true)
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'POSITION', desc: false })
  const [ menuShown2, setMenuShown2 ] = useState(false)
  const slideAnim2 = useState(new Animated.Value(0))[0]
  const listRef = useRef(null)

  const openMenu2 = () => {
    setMenuShown2(true)
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }
  const closeMenu2 = () => {
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown2(false))
  }
  const translateY2 = slideAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  })

  const loadBaseData = useCallback(async () => {
    setServer(Response.loading)
    try {
      if (user?.userId) {
        const res = await fetch(`${BaseUrl.api}/lists/${listId}?UserId=${user.userId}`)
        if (res.ok) {
          const json = await res.json()
          setBase(json.list)
          setILiked(json.iLiked)
          setServer(Response.ok)
        } else if (res.status === 404) {
          setServer(Response.notFound)
          setBase({})
        } else {
          setServer(Response.internalServerError)
          setBase({})
        }
      } else {
        const res = await fetch(`${BaseUrl.api}/lists/${listId}`)
        if (res.ok) {
          const json = await res.json()
          setBase(json)
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
        ? `${BaseUrl.api}/lists/entries/${listId}?UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
        : `${BaseUrl.api}/lists/entries/${listId}?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, entries: json.items, totalCount: json.totalCount, seenFilms: json.seen, seenCount: json.seenCount })
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, listId, currentFilter, currentSort])

  const handleLike = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    const delta = iLiked ? -1 : 1
    setILiked(prev => !prev)
    setData(prev => ({...prev, likeCount: prev.likeCount + delta}))
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/like`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.userId,
          UserName: user.name,
          AuthorId: base?.authorId,
          ReviewId: null,
          FilmTitle: null,
          ListId: listId,
          ListName: base?.name,
          LikeChange: delta
        })
      })
      if (!res.ok) {
        console.log(`${res.status}: list like failed.`)
      }
    } catch {
      console.log('like list failed; network error.')
    }
  }, [user, iLiked, base, listId])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  useEffect(() => {
    if (!base) return
    loadDataPage(1)
  }, [base, currentFilter, currentSort])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    if (!base) return
    navigation.setOptions({
      headerTitle: `${base.authorName}'s list`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => {
        return (
          <>
            <ListOptionsButton listId={base.id} />
            {
              !base.ranked && 
              <Pressable onPress={openMenu2} style={{marginLeft: 15, marginRight: widescreen ? 15 : null}}>
                <Ionicons name='options' size={24} color={Colors.text} />
              </Pressable>
            }
          </>
        )
      }
    })
  }, [navigation, widescreen, base, openMenu2])

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE)
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
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

  const Header = () => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      <Text style={[styles.title, {fontSize: widescreen ? 24 : 20, marginTop: 20}]}>{base?.name}</Text>
      <Pressable onPress={() => setDescCollapsed(prev => !prev)}>
        <Text style={[styles.desc, {fontSize: widescreen ? 16 : 13}]}>
          {descCollapsed && base?.description?.length > 300
            ? `${base?.description.slice(0, 300)}...`
            : base?.description}
        </Text>
      </Pressable>
      <View style={styles.metaRow}>
        <Pressable onPress={handleLike} style={styles.likeRow}>
          <MaterialCommunityIcons
            name={iLiked ? 'cards-heart' : 'cards-heart-outline'}
            size={widescreen ? 24 : 20}
            color={iLiked ? Colors.heteroboxd : Colors.text}
          />
          <Text style={[styles.metaText, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(base?.likeCount)} likes</Text>
        </Pressable>
        <Text style={[styles.metaText, {fontSize: widescreen ? 18 : 14}]}>{data.totalCount > 0 ? `${data.totalCount} entries` : ''}</Text>
      </View>
      {
        user && server.result > 0 ? (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View />
          <Pressable onPress={() => setFadeSeen(prev => !prev)} style={{alignSelf: 'right', paddingTop: 5}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="eye-outline" size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
              <Text style={{ color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13 }}> {format.roundSeen(data.seenCount, data.totalCount)}% seen</Text>
            </View>
          </Pressable>
        </View>
        ) : <View />
      }
      <View style={{height: 20}} />
    </View>
  )

  const Film = ({ item }) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    const isSeen = fadeSeen && (data.seenFilms?.includes(item.filmId) ?? false)
    return (
      <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{ margin: spacing / 2 }}>
        <Poster
          posterUrl={item.filmPosterUrl}
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
            <Text
              style={{
                color: Colors.text_title,
                fontSize: widescreen ? 12 : 8,
                fontWeight: 'bold',
                lineHeight: 18,
              }}
            >
              {item.position}
            </Text>
          </View>
        )}
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
        data={paddedEntries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={Header}
        renderItem={Film}
        ListFooterComponent={Footer}
        ListEmptyComponent={
          server.result === 0
          ? <View style={{padding: 50, alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>
          : <Text style={{textAlign: 'center', color: Colors.text, padding: 50, fontSize: widescreen ? 20 : 16}}>Nothing to see here.</Text>
        }
        style={{alignSelf: 'center'}}
        contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
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
              key={`${currentFilter.field}-${currentSort.field}`}
              context={'list'}
              currentFilter={currentFilter}
              onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu2()}}
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
    justifyContent: 'space-between',
    marginTop: 8
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
