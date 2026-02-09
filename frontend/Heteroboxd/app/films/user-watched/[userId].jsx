import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Platform, StyleSheet, useWindowDimensions, View, FlatList, Pressable, RefreshControl, Animated, Text } from 'react-native'
import { Colors } from '../../../constants/colors';
import { useEffect, useMemo, useState, useRef } from 'react';
import { BaseUrl } from '../../../constants/api';
import LoadingResponse from '../../../components/loadingResponse';
import Popup from '../../../components/popup';
import PaginationBar from '../../../components/paginationBar';
import { Poster } from '../../../components/poster';
import SlidingMenu from '../../../components/slidingMenu'
import FilterSort from '../../../components/filterSort'
import { Ionicons } from '@expo/vector-icons'

const PAGE_SIZE = 24;

const UserWatchedFilms = () => {
  const { userId } = useLocalSearchParams();

  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPagination, setShowPagination] = useState(false);

  const [currentFilter, setCurrentFilter] = useState({field: 'ALL', value: null})
  const [currentSort, setCurrentSort] = useState({field: 'DATE WATCHED', desc: true})

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

  const loadUserWatchedPage = async (pageNumber) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${BaseUrl.api}/films/user/${userId}?Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
      if (res.status === 200) {
        const json = await res.json();
        setPage(json.page);
        setTotalCount(json.totalCount);
        setEntries(json.items);
      } else {
        setResult(500);
        setMessage("Something went wrong! Contact Heteroboxd support for more information!");
      }
    } catch {
      setResult(500);
      setMessage("Network error! Check your internet connection...");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1)
    loadUserWatchedPage(1)
  }, [currentFilter, currentSort])

  useEffect(() => {
    setPage(1)
    loadUserWatchedPage(1)
  }, [userId])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Recents',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => (
        <Pressable onPress={openMenu} style={{marginRight: 15}}>
          <Ionicons name="options" size={24} color={Colors.text_title} />
        </Pressable>
      ),
    })
  }, [])

  useEffect(() => {
    setCurrentSort({field: 'DATE WATCHED', desc: true})
  }, [currentFilter.field])

  //page count
  const totalPages = Math.ceil(totalCount/PAGE_SIZE);
  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect

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
        ListEmptyComponent={<Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>There are currently no films matching this criteria...</Text>}
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
              style={{ margin: spacing / 2 }}
            >
              <Poster
                posterUrl={item.posterUrl}
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
        ListFooterComponent={() => (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            visible={showPagination}
            onPagePress={(num) => {
              setPage(num);
              loadUserWatchedPage(num);
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadUserWatchedPage(page)}
          />
        }
        style={{
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingHorizontal: spacing / 2,
          paddingBottom: 80,
          marginTop: 50,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />

      <LoadingResponse visible={isLoading} />
      <Popup visible={[401, 500].includes(result)} message={message} onClose={() => result === 500 ? router.replace('/contact') : router.replace('/')} />
    
      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'userWatched'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    
    </View>
  );
}

export default UserWatchedFilms

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50,
  }
})