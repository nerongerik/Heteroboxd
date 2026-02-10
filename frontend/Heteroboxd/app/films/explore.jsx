import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { StyleSheet, Text, useWindowDimensions, View, Pressable, FlatList, RefreshControl, Animated } from 'react-native'
import { BaseUrl } from '../../constants/api';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Colors } from '../../constants/colors';
import { Poster } from '../../components/poster';
import PaginationBar from '../../components/paginationBar';
import LoadingResponse from '../../components/loadingResponse';
import Popup from '../../components/popup';
import SlidingMenu from '../../components/slidingMenu';
import FilterSort from '../../components/filterSort';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const PAGE_SIZE = 24

const Explore = () => {
  const { user } = useAuth()

  const { filter, value } = useLocalSearchParams(); //instant routing sort
  const [currentFilter, setCurrentFilter] = useState({field: 'ALL', value: null})
  const [currentSort, setCurrentSort] = useState({field: 'RELEASE DATE', desc: true})

  const router = useRouter();
  const navigation = useNavigation();

  const { width } = useWindowDimensions();

  const [films, setFilms] = useState([]);
  const [seenFilms, setSeenFilms] = useState([]);
  const [seenCount, setSeenCount] = useState(0);
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPagination, setShowPagination] = useState(false)

  const [fadeSeen, setFadeSeen] = useState(true);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

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

  const loadPage = async (pageNumber) => {
    try {
      setIsLoading(true)
      const url = user
        ? `${BaseUrl.api}/films?UserId=${user.userId}&Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
        : `${BaseUrl.api}/films?Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`
        const res = await fetch(url, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      })
      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setFilms(json.items)
        setSeenFilms(json.seen)
        setSeenCount(json.seenCount)
      } else {
        setResult(res.status)
        setMessage('Loading error! Try reloading Heteroboxd.')
      }
    } catch {
      setResult(500)
      setMessage('Network error! Check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!filter || !value) return;
    setCurrentFilter({field: filter, value: value});
  }, [filter, value])

  useEffect(() => {
    setPage(1);
    loadPage(1);
  }, [currentFilter, currentSort])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Explore',
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
    if (currentFilter.field === 'POPULAR' || currentFilter.field === 'YEAR') {
      setCurrentSort({field: 'POPULARITY', desc: true})
    } else if (currentFilter.field === 'ALL' || currentFilter.field === 'GENRE' || currentFilter.field === 'COUNTRY') {
      setCurrentSort({field: 'RELEASE DATE', desc: true})
    }
  }, [currentFilter.field])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const paddedFilms = useMemo(() => {
    const padded = [...films];
    const remainder = padded.length % 4;
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder;
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null);
      }
    }
    return padded;
  }, [films]);

  const renderHeader = () => (
    <>
      {
        !isLoading && (
          <View style={{ width: maxRowWidth, alignSelf: 'center' }}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10}}>
              <Text style={{color: Colors.text, fontSize: widescreen ? 16 : 13}}>Exploring {totalCount} films</Text>
              {
                user ? (
                  <Pressable onPress={() => setFadeSeen(prev => !prev)}>
                    <View style={{ padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="eye-outline" size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
                      <Text style={{ color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13 }}> {Math.floor(seenCount / totalCount * 100)}% seen</Text>
                    </View>
                  </Pressable>
                ) : <View />
              }
            </View>
            <View style={{ height: 20 }} />
          </View>
        )
      }
    </>
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
          posterUrl={item.posterUrl}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSeen ? Colors.heteroboxd : Colors.border_color,
            opacity: isSeen ? 0.3 : 1
          }}
        />
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
        loadPage(num)
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
      }}
    />
  )

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={paddedFilms}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={renderHeader}
        renderItem={renderContent}
        ListEmptyComponent={() => {
          if (!isLoading) return <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>There are currently no films matching this criteria...</Text>
        }}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadPage(page)} />
        }
        style={{
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingHorizontal: spacing / 2,
          paddingBottom: 80,
        }}
        columnWrapperStyle={{
          alignSelf: 'center'
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

      <SlidingMenu menuShown={menuShown} closeMenu={() => {closeMenu()}} translateY={translateY} widescreen={widescreen} width={width}>
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'explore'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>

    </View>
  )
}

export default Explore

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    paddingBottom: 50
  },
})