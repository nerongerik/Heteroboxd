import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { StyleSheet, useWindowDimensions, View, FlatList, Pressable, Text, RefreshControl, Animated } from 'react-native'
import { Colors } from '../../constants/colors'
import { useEffect, useMemo, useState, useRef } from 'react'
import { BaseUrl } from '../../constants/api'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import PaginationBar from '../../components/paginationBar'
import { Poster } from '../../components/poster'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import ListOptionsButton from '../../components/optionButtons/listOptionsButton'
import SlidingMenu from '../../components/slidingMenu'
import FilterSort from '../../components/filterSort'
import { Ionicons } from '@expo/vector-icons'

const PAGE_SIZE = 24

const List = () => {
  const { listId } = useLocalSearchParams()
  const router = useRouter()
  const navigation = useNavigation();
  const { width } = useWindowDimensions()
  const { user, isValidSession } = useAuth()

  const [result, setResult] = useState(-1)
  const [message, setMessage] = useState('')

  const [baseList, setBaseList] = useState(null)
  const [entries, setEntries] = useState([])
  const [seenFilms, setSeenFilms] = useState([]);
  const [seenCount, setSeenCount] = useState(0);
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPagination, setShowPagination] = useState(false)

  const [fadeSeen, setFadeSeen] = useState(true);

  const [likeCount, setLikeCount] = useState(0)
  const [iLiked, setILiked] = useState(false)
  const [descCollapsed, setDescCollapsed] = useState(true)

  const [currentFilter, setCurrentFilter] = useState({field: 'ALL', value: null})
  const [currentSort, setCurrentSort] = useState({field: 'POSITION', desc: false})

  const [menuShown2, setMenuShown2] = useState(false)
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

  const loadBaseList = async () => {
    try {
      const res = await fetch(`${BaseUrl.api}/lists/${listId}`)
      if (res.status === 200) {
        const json = await res.json()
        setBaseList(json)
        setLikeCount(Number(json.likeCount))
      } else if (res.status === 404) {
        setResult(404)
        setMessage('This list no longer exists!')
      } else {
        throw new Error()
      }
    } catch {
      setResult(500)
      setMessage('Something went wrong! Contact support.')
    }
  }

  const loadListPage = async (pageNumber) => {
    if (!baseList) return
    try {
      setIsLoading(true)
      const url = user
        ? `${BaseUrl.api}/lists/entries/${baseList.id}?UserId=${user.userId}&Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
        : `${BaseUrl.api}/lists/entries/${baseList.id}?Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
      const res = await fetch(url)
      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setEntries(json.items)
        setSeenFilms(json.seen)
        setSeenCount(json.seenCount)
      } else {
        setResult(res.status)
        setMessage('Loading error! Try reloading Heteroboxd.')
      }
    } catch {
      setResult(500)
      setMessage('Network error! Check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadLiked = async () => {
    const vS = await isValidSession();
    if (!user || !vS) return
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(
        `${BaseUrl.api}/users/${user.userId}/liked/${listId}?ObjectType=list`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      )
      const json = await res.json();
      if (res.status === 200) setILiked(json)
      else console.log('failed to load iLiked');
    } catch {
      console.log('failed to load iLiked');
    }
  }

  useEffect(() => {
    loadBaseList()
  }, [listId])

  useEffect(() => {
    setPage(1)
    loadListPage(1)
  }, [currentFilter, currentSort])

  useEffect(() => {
    setPage(1)
    loadListPage(1)
  }, [baseList])

  useEffect(() => {
    loadLiked()
  }, [user, listId])

  useEffect(() => {
    if (!baseList) return;
    navigation.setOptions({
      headerTitle: `${baseList.authorName}'s list`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => {
        if (baseList) {
          return (
            <>
              <ListOptionsButton listId={baseList.id} />
              {
                !baseList.ranked && 
                <Pressable onPress={openMenu2} style={{marginLeft: 15, marginRight: widescreen ? 15 : null}}>
                  <Ionicons name="options" size={24} color={Colors.text} />
                </Pressable>
              }
            </>
          )
        }
      },
    });
  }, [baseList])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const paddedEntries = useMemo(() => {
    const padded = [...entries];
    const remainder = padded.length % 4;
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder;
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null);
      }
    }
    return padded;
  }, [entries]);

  const handleLike = async () => {
    const vS = await isValidSession();
    if (!user || !vS) return
    const delta = iLiked ? -1 : 1
    setILiked(!iLiked)
    setLikeCount((c) => c + delta)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'UserId': user.userId,
          'UserName': user.name,
          'AuthorId': baseList?.authorId,
          'ReviewId': null,
          'FilmTitle': null,
          'ListId': listId,
          'ListName': baseList?.name,
          'LikeChange': delta
        })
      })
      if (res.status !== 200) console.log('failed to send like request for this list');
    } catch { console.log('failed to like/unlike list.') }
  }

  const renderHeader = () => (
    <View style={{ width: maxRowWidth, alignSelf: 'center' }}>
      <Text style={[styles.title, {fontSize: widescreen ? 24 : 20, marginTop: 20}]}>{baseList?.name}</Text>
      <Pressable onPress={() => setDescCollapsed((p) => !p)}>
        <Text style={[styles.desc, {fontSize: widescreen ? 16 : 13}]}>
          {descCollapsed && baseList?.description?.length > 300
            ? `${baseList.description.slice(0, 300)}...`
            : baseList?.description}
        </Text>
      </Pressable>
      <View style={styles.metaRow}>
        <Pressable onPress={handleLike} style={styles.likeRow}>
          <MaterialCommunityIcons
            name={iLiked ? 'cards-heart' : 'cards-heart-outline'}
            size={widescreen ? 24 : 20}
            color={iLiked ? Colors.heteroboxd : Colors.text}
          />
          <Text style={[styles.metaText, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(likeCount)} likes</Text>
        </Pressable>
        <Text style={[styles.metaText, {fontSize: widescreen ? 18 : 14}]}>{totalCount} entries</Text>
      </View>
      {
        user && !isLoading ? (
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View />
          <Pressable onPress={() => setFadeSeen(prev => !prev)} style={{alignSelf: 'right', paddingTop: 5}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="eye-outline" size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
              <Text style={{ color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13 }}> {Math.floor(seenCount / totalCount * 100)}% seen</Text>
            </View>
          </Pressable>
        </View>
        ) : <View />
      }
      <View style={{ height: 20 }} />
    </View>
  )

  const renderContent = ({item}) => {
    if (!item) {
      return (
        <View
          style={{
            width: posterWidth,
            height: posterHeight,
            margin: spacing / 2,
          }}
        />
      );
    }
    const isSeen = fadeSeen && (seenFilms?.includes(item.filmId) ?? false)
    return (
      <Pressable
        onPress={() => router.push(`/film/${item.filmId}`)}
        style={{ margin: spacing / 2 }}
      >
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
        {baseList?.ranked && (
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
    );
  }

  const renderFooter = () => (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      visible={showPagination}
      onPagePress={(num) => {
        setPage(num)
        loadListPage(num)
      }}
    />
  )

  if (!baseList) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 5,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={paddedEntries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={renderHeader}
        renderItem={renderContent}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadListPage(page)} />
        }
        style={{
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingHorizontal: spacing / 2,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />

      <LoadingResponse visible={isLoading} />
      <Popup
        visible={[404, 500].includes(result)}
        message={message}
        onClose={() =>
          result === 500
            ? router.replace('/contact')
            : router.replace('/')
        }
      />

      {
        baseList && !baseList.ranked && (
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingBottom: 50
  },
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
