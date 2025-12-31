import { useLocalSearchParams, useRouter } from 'expo-router'
import { Platform, StyleSheet, useWindowDimensions, View, FlatList, Pressable, RefreshControl, Modal, Animated, Text } from 'react-native'
import { useAuth } from '../../../hooks/useAuth'
import { Colors } from '../../../constants/colors'
import { useEffect, useMemo, useState, useRef } from 'react'
import * as auth from '../../../helpers/auth'
import { BaseUrl } from '../../../constants/api'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import PaginationBar from '../../../components/paginationBar'
import { Poster } from '../../../components/poster'
import { FontAwesome5 } from '@expo/vector-icons'

const Watchlist = () => {
  const { userId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()

  const router = useRouter()
  const { width } = useWindowDimensions()

  const [result, setResult] = useState(-1)
  const [message, setMessage] = useState('')

  const pageSize = 48

  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showPagination, setShowPagination] = useState(false)

  const deletable = useRef(-1);

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

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
      const res = await fetch(
        `${BaseUrl.api}/users/watchlist/${userId}?Page=${pageNumber}&PageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
        }
      )

      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setEntries(json.entries)
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
  }, [userId])

  const handleDelete = async () => {
    const vS = await isValidSession();
    if (!user || !vS || user.userId !== userId) return;
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/watchlist/${userId}/${deletable.current}`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${jwt}`}
      });
      if (res.status === 200) {
        closeMenu();
        deletable.current = -1;
        loadWatchlistPage(page);
      } else {
        closeMenu();
        deletable.current = -1;
        setResult(res.status)
        setMessage('Something went wrong! Try reloading Heteroboxd!')
      }
    } catch {
      closeMenu();
      deletable.current = -1;
      setResult(500)
      setMessage('Network error! Check your internet connection...')
    }
  }

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
    }).start(async () => {
      setMenuShown(false);
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], //slide from bottom
  });

  const totalPages = Math.ceil(totalCount / pageSize)

  const widescreen = useMemo(
    () => Platform.OS === 'web' && width > 1000,
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
        data={paddedEntries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        numColumns={4}
        ListHeaderComponent={
          <>
          <Text style={{color: Colors.text, fontSize: widescreen ? 16 : 13, textAlign: 'center'}}>
            Tip: to remove a film from your watchlist quickly, you can just press and hold on it's poster!
          </Text>
          <View style={{height: 35}} />
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
              onLongPress={() => {
                deletable.current = item.filmId;
                openMenu();
              }}
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

      <Modal transparent visible={menuShown} animationType="fade">
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.05)' }]} />
        </Pressable>

        <Animated.View style={[styles.menu, {width: widescreen ? 750 : '100%', alignSelf: 'center'}, { transform: [{ translateY }] }]}>
          <Pressable onPress={handleDelete} style={{padding: 15, alignItems: 'center', flexDirection: 'row'}}>
            <Text style={{color: Colors.text, fontSize: 16}}>Remove from Watchlist </Text>
            <FontAwesome5 name="trash" size={20} color={Colors.text} />
          </Pressable>
        </Animated.View>
      </Modal>

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
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: Colors.card,
    paddingVertical: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
})
