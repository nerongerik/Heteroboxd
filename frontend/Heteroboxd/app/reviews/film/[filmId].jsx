import { StyleSheet, Text, View, Platform, useWindowDimensions, FlatList, Pressable, RefreshControl, Animated } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo, useState, useRef } from 'react'
import { Colors } from '../../../constants/colors'
import { BaseUrl } from '../../../constants/api'
import PaginationBar from '../../../components/paginationBar'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import Fontisto from '@expo/vector-icons/Fontisto'
import Author from '../../../components/author'
import { useAuth } from '../../../hooks/useAuth'
import * as auth from '../../../helpers/auth'
import * as format from '../../../helpers/format'
import Stars from '../../../components/stars'
import ParsedRead from '../../../components/parsedRead'
import SlidingMenu from '../../../components/slidingMenu';
import FilterSort from '../../../components/filterSort';
import { Ionicons } from '@expo/vector-icons';

const PAGE_SIZE = 24

const FilmsReviews = () => {
  const { filmId } = useLocalSearchParams()

  const { user, isValidSession } = useAuth();
  const [uwf, setUwf] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState(() => new Set());

  const navigation = useNavigation();
  const router = useRouter()
  const { width } = useWindowDimensions()


  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [showPagination, setShowPagination] = useState(false)

  const [result, setResult] = useState(-1)
  const [message, setMessage] = useState('')

  const [currentFilter, setCurrentFilter] = useState({field: 'ALL', value: null})
  const [currentSort, setCurrentSort] = useState({field: 'POPULARITY', desc: true})

  const listRef = useRef(null);

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  const openMenu = () => {
    setMenuShown(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false));
  };
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], //slide from bottom
  });

  const loadReviewsPage = async (pageNumber) => {
    try {
      setIsLoading(true)

      const res = await fetch(`${BaseUrl.api}/reviews/film-reviews/${filmId}?UserId=${user?.userId}&Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      })

      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setReviews(json.items)
      } else if (res.status === 404) {
        setResult(404)
        setMessage("This film doesn't exist anymore!")
      } else {
        setResult(500)
        setMessage('Something went wrong! Contact Heteroboxd support.')
      }
    } catch {
      setResult(500)
      setMessage('Network error! Check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1);
    loadReviewsPage(1);
  }, [currentFilter, currentSort])

  useEffect(() => {
    setPage(1)
    loadReviewsPage(1)
  }, [filmId])

  useEffect(() => {
    (async () => {
      const vS = await isValidSession();
      if (!user || !vS) return; //no need to break, non-members can also view reviews
      try {
        const jwt = await auth.getJwt();
        const res = await fetch(`${BaseUrl.api}/users/uwf/${user?.userId}/${filmId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        });
        if (res.status === 200) setUwf(true);
        else setUwf(false);
      } catch {
        console.log('Network error!') //probably caught by previous useEffect, no need to break here
      }
    })();
  }, [filmId, user])

  useEffect(() => {
    const first = reviews[0];
    if (!first) return;
    navigation.setOptions({
      headerTitle: `Reviews of ${first.filmTitle.slice(0, 20)}${first.filmTitle.length > 20 ? '...' : ''}`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: 15}}>
          <Ionicons name="options" size={24} color={Colors.text_title} />
        </Pressable>
      ),
    });
  }, [reviews])

  useEffect(() => {
    setCurrentSort({field: 'POPULARITY', desc: true})
  }, [currentFilter.field])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const widescreen = useMemo(
    () => Platform.OS === 'web' && width > 1000,
    [width]
  )

  const maxRowWidth = useMemo(
    () => (widescreen ? 900 : width * 0.95),
    [widescreen, width]
  )

  const canSeeSpoilers = useMemo(() => uwf === true, [uwf])
  const isRevealed = (reviewId) => revealedSpoilers.has(reviewId);

  const revealSpoiler = (reviewId) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      next.add(reviewId);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={reviews}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => {
          if (!isLoading) return <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>There are currently no reviews matching this criteria...</Text>
        }}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: 5 }]}>
            <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Author
                userId={item.authorId}
                url={item.authorProfilePictureUrl}
                username={item.authorName}
                tier={item.authorTier}
                patron={item.authorPatron}
                router={router}
                widescreen={widescreen}
              />
              <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
            </View>
            <Pressable onPress={() => router.push(`/review/${item.id}`)}>
              {
                item.text && item.text.length > 0 ?
                  canSeeSpoilers || isRevealed(item.id) ? (
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
                  ) : <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center'}}>{item.authorName} wrote no review regarding this film.</Text>
              }
              <View style={styles.statsRow}>
                <Fontisto name="heart" size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
                <Text style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</Text>
              </View>
            </Pressable>
          </View>
        )}
        ListFooterComponent={() => (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            visible={showPagination}
            onPagePress={(num) => {
              setPage(num)
              loadReviewsPage(num)
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadReviewsPage(page)}
          />
        }
        contentContainerStyle={{
          width: maxRowWidth,
          paddingBottom: 80,
          marginTop: 40,
          alignSelf: 'center',
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
          result === 500 ? router.replace('/contact') : router.replace('/')
        }
      />

      <SlidingMenu menuShown={menuShown} closeMenu={closeMenu} translateY={translateY} widescreen={widescreen} width={width}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50,
  },
  card: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border_color,
    borderRadius: 6,
    backgroundColor: Colors.card,
    padding: 5
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  statText: {
    marginHorizontal: 4,
    fontWeight: 'bold',
    color: Colors.heteroboxd,
  },
})
