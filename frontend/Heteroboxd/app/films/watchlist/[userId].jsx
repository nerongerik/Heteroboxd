import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { StyleSheet, useWindowDimensions, View, FlatList, Pressable, RefreshControl, Text, Animated, Platform } from 'react-native'
import { useAuth } from '../../../hooks/useAuth'
import { Colors } from '../../../constants/colors'
import { useEffect, useMemo, useState, useRef } from 'react'
import * as auth from '../../../helpers/auth'
import { BaseUrl } from '../../../constants/api'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import PaginationBar from '../../../components/paginationBar'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'
import FilterSort from '../../../components/filterSort'
import { Ionicons } from '@expo/vector-icons'

const PAGE_SIZE = 24

const Watchlist = () => {
  const { userId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()

  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()

  const [result, setResult] = useState(-1)
  const [message, setMessage] = useState('')

  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPagination, setShowPagination] = useState(false)

  const [currentFilter, setCurrentFilter] = useState({field: 'ALL', value: null})
  const [currentSort, setCurrentSort] = useState({field: 'DATE ADDED', desc: true})

  const [menuShown, setMenuShown] = useState(false)
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

  const loadWatchlistPage = async (pageNumber) => {
    try {
      const vS = await isValidSession();
      if (!vS || !user || user.userId !== userId) {
        setResult(401)
        setMessage('Wrong credentials! Try logging in again...')
        return
      }

      setIsLoading(true)

      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/watchlist/${userId}?Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      })

      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setEntries(json.items)
      } else {
        setResult(500)
        setMessage('Something went wrong! Contact Heteroboxd support for more information!')
      }
    } catch {
      setResult(500)
      setMessage('Network error! Check your internet connection...')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadWatchlistPage(1)
  }, [currentFilter, currentSort])

  useEffect(() => {
    setPage(1)
    loadWatchlistPage(1)
  }, [userId])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Watchlist',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name="options" size={24} color={Colors.text} />
        </Pressable>
      ),
    })
  }, [])

  useEffect(() => {
    setCurrentSort({field: 'DATE ADDED', desc: true})
  }, [currentFilter.field])

  const handleDelete = async (filmId) => {
    const vS = await isValidSession();
    if (!user || !vS || user.userId !== userId) return;
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/watchlist/${userId}/${filmId}`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${jwt}`}
      });
      if (res.status === 200) {
        loadWatchlistPage(page);
      } else {
        setResult(res.status)
        setMessage('Something went wrong! Try reloading Heteroboxd!')
      }
    } catch {
      setResult(500)
      setMessage('Network error! Check your internet connection...')
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const widescreen = useMemo(
    () => width > 1000,
    [width]
  )
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(
    () => (widescreen ? 1000 : width * 0.95),
    [widescreen]
  )
  const posterWidth = useMemo(
    () => (maxRowWidth - spacing * 4) / 4,
    [maxRowWidth, spacing]
  )
  const posterHeight = useMemo(
    () => posterWidth * (3 / 2),
    [posterWidth]
  )

  //padded entries
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

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={paddedEntries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListEmptyComponent={<Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Your Watchlist lies empty...</Text>}
        ListHeaderComponent={
            <>
            {
              user && user.userId == userId && 
                <>
                <Text style={{color: Colors.text, fontSize: widescreen ? 16 : 13, textAlign: 'center'}}>
                  Tip: to remove a film from your watchlist quickly, just press and hold on it's poster!
                </Text>
                <View style={{height: 35}} />
                </>
            }
            </>
        }
        renderItem={({ item }) => {
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
          return (
            <Pressable
              onPress={() => router.push(`/film/${item.filmId}`)}
              onLongPress={() => {handleDelete(item.filmId)}}
              style={{ margin: spacing / 2 }}
            >
              <Poster
                posterUrl={item.filmPosterUrl}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                }}
              />
            </Pressable>
          );
        }}
        ListFooterComponent={
          <PaginationBar
            page={page}
            totalPages={totalPages}
            visible={showPagination}
            onPagePress={(num) => {
              setPage(num)
              loadWatchlistPage(num)
            }}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadWatchlistPage(page)}
          />
        }
        style={{
          alignSelf: 'center'
        }}
        columnWrapperStyle={{
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
        visible={[401, 404, 500].includes(result)}
        message={message}
        onClose={() =>
          result === 500
            ? router.replace('/contact')
            : router.replace('/')
        }
      />

      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={() => {closeMenu()}} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'watchlist'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>

    </View>
  )
}

export default Watchlist

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50,
  },
})
