import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { StyleSheet, Text, useWindowDimensions, View, Pressable, FlatList, RefreshControl } from 'react-native'
import { BaseUrl } from '../../constants/api';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Colors } from '../../constants/colors';
import { Poster } from '../../components/poster';
import PaginationBar from '../../components/paginationBar';
import LoadingResponse from '../../components/loadingResponse';
import Popup from '../../components/popup';

const PAGE_SIZE = 48

const Explore = () => {
  const { type, subtype } = useLocalSearchParams();

  const router = useRouter();
  const navigation = useNavigation();

  const { width } = useWindowDimensions();

  const [films, setFilms] = useState([]);
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPagination, setShowPagination] = useState(false)

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const listRef = useRef(null);

  const loadExplorePage = async (pageNumber) => {
    if (!type || !subtype) return;
    try {
      setIsLoading(true)
      const res = await fetch(`${BaseUrl.api}/films/${type}/${subtype}?Page=${pageNumber}&PageSize=${PAGE_SIZE}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      })
      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setFilms(json.films)
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
    setPage(1);
    loadExplorePage(1);
  }, [type, subtype])

  useEffect(() => {
    if (!subtype) return;
    navigation.setOptions({
      headerTitle: subtype,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
    });
  })

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
    <View style={{ width: maxRowWidth, alignSelf: 'center' }}>
      <Text style={{paddingRight: 10, color: Colors.text, fontSize: widescreen ? 16 : 13}}>Exploring {totalCount} films</Text>
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
  }

  const renderFooter = () => (
    <PaginationBar
      page={page}
      totalPages={totalPages}
      visible={showPagination}
      onPagePress={(num) => {
        setPage(num)
        loadExplorePage(num)
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
        ListEmptyComponent={<Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, padding: 35}}>There are currently no films matching this criteria...</Text>}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => loadExplorePage(page)} />
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