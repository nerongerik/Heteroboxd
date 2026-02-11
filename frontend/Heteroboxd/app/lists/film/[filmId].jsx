import { StyleSheet, Text, View, Platform, useWindowDimensions, FlatList, Pressable, Animated } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo, useState, useRef } from 'react'
import { Colors } from '../../../constants/colors'
import { BaseUrl } from '../../../constants/api'
import PaginationBar from '../../../components/paginationBar'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import Fontisto from '@expo/vector-icons/Fontisto'
import Author from '../../../components/author'
import * as format from '../../../helpers/format'
import { useAuth } from '../../../hooks/useAuth'
import SlidingMenu from '../../../components/slidingMenu';
import FilterSort from '../../../components/filterSort';
import { Ionicons } from '@expo/vector-icons';

const PAGE_SIZE = 24

const FilmsLists = () => {
  const { user } = useAuth();

  const { filmId } = useLocalSearchParams()

  const navigation = useNavigation()
  const router = useRouter()

  const { width } = useWindowDimensions()

  const [lists, setLists] = useState([])
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

  const loadListsPage = async (pageNumber) => {
    try {
      setIsLoading(true)

      const res = await fetch(`${BaseUrl.api}/lists/featuring-film/${filmId}?UserId=${user?.userId}&Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`, {
        method: 'GET',
        headers: {Accept: 'application/json'}
      })

      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setLists(json.items)
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
    loadListsPage(1);
  }, [currentFilter, currentSort])

  useEffect(() => {
    setPage(1)
    loadListsPage(1)
  }, [filmId])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Featuring lists',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name="options" size={24} color={Colors.text} />
        </Pressable>
      ),
    });
  }, [])

  useEffect(() => {
    setCurrentSort({field: 'POPULARITY', desc: true})
  }, [currentFilter.field])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const widescreen = useMemo(
    () => Platform.OS === 'web' && width > 1000,
    [width]
  )

  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])

  const maxRowWidth = useMemo(
    () => (widescreen ? 900 : width * 0.95),
    [widescreen, width]
  )

  const posterWidth = useMemo(
    () => (maxRowWidth - spacing * 4) / 4,
    [maxRowWidth, spacing]
  )

  const posterHeight = useMemo(
    () => posterWidth * (3 / 2),
    [posterWidth]
  )

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={lists}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => {
          if (!isLoading) {
            return <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>There are currently no lists matching this criteria...</Text>
          }
        }}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: spacing * 1.25 }]}>
            <View style={{marginLeft: 5, marginBottom: -5}}>
              <Author
                userId={item.authorId}
                url={item.authorProfilePictureUrl}
                username={item.authorName}
                tier={item.authorTier}
                patron={item.authorPatron}
                router={router}
                widescreen={widescreen}
              />
            </View>
            <Pressable onPress={() => router.push(`/list/${item.id}`)}>
              <Text style={[styles.listTitle, {fontSize: widescreen ? 22 : 18}]}>{item.name}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {(() => {
                  const paddedFilms = [...item.films].sort((a, b) => a.position - b.position);
                  const remainder = paddedFilms.length % 4;
                  if (remainder !== 0) {
                    const placeholdersToAdd = 4 - remainder;
                    for (let i = 0; i < placeholdersToAdd; i++) {
                      paddedFilms.push(null);
                    }
                  }
                
                  return paddedFilms.map((film, i) => (
                    film ? (
                      <Poster
                        key={film.filmId}
                        posterUrl={film.filmPosterUrl}
                        style={{
                          width: posterWidth,
                          height: posterHeight,
                          marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing/2,
                          borderWidth: 2,
                          borderColor: Colors.border_color,
                          borderRadius: 6,
                        }}
                      />
                    ) : (
                      <View
                        key={`placeholder-${i}`}
                        style={{
                          width: posterWidth,
                          height: posterHeight,
                          marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing/2,
                        }}
                      />
                    )
                  ));
                })()}
              </View>

              <Text style={[styles.description, {fontSize: widescreen ? 18 : 14}]}>
                {item.description.slice(0, widescreen ? 500 : 150)}
                {widescreen && item.description.length > 500 && '...'}
                {!widescreen && item.description.length > 150 && '...'}
              </Text>

              <View style={styles.statsRow}>
                <Fontisto name="nav-icon-list-a" size={widescreen ? 18 : 14} color={Colors._heteroboxd} />
                <Text style={[styles.statText, {color: Colors._heteroboxd, fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.listEntryCount)} </Text>
                <Fontisto name="heart" size={widescreen ? 18 : 14} color={Colors.heteroboxd} />
                <Text style={[styles.statText, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.likeCount)}</Text>
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
              loadListsPage(num)
            }}
          />
        )}
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

      <SlidingMenu menuShown={menuShown} closeMenu={() => {closeMenu()}} translateY={translateY} widescreen={widescreen} width={width}>
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'filmLists'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>

    </View>
  )
}

export default FilmsLists

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50,
  },
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
