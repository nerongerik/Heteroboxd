import { useLocalSearchParams, useRouter } from 'expo-router'
import { Platform, StyleSheet, useWindowDimensions, View, FlatList, Pressable } from 'react-native'
import { useAuth } from '../../../hooks/useAuth';
import { Colors } from '../../../constants/colors';
import { useEffect, useMemo, useState } from 'react';
import * as auth from '../../../helpers/auth';
import { BaseUrl } from '../../../constants/api';
import LoadingResponse from '../../../components/loadingResponse';
import Popup from '../../../components/popup';
import PaginationBar from '../../../components/paginationBar';
import { Poster } from '../../../components/poster';

const Watchlist = () => {

  const { userId } = useLocalSearchParams();
  const { user, isValidSession } = useAuth();

  const router = useRouter();
  const { width } = useWindowDimensions();

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const loadWatchlistPage = async (page, replace = false) => {
    try {
      if (await isValidSession() && user && user.userId === userId) {
        setIsLoading(true);

        const jwt = await auth.getJwt();
        const res = await fetch(`${BaseUrl.api}/users/watchlist/${userId}?Page=${page}&PageSize=${pageSize}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${jwt}`,
          }
        });

        if (res.status === 200) {
          const json = await res.json();
          setPage(json.page);
          setTotalCount(json.totalCount);
          setPageSize(json.pageSize);
          setEntries(prev =>
            replace ? json.entries : [...prev, ...json.entries]
          );
          if (json.entries.length < json.pageSize)
            setIsEnd(true);
        } else {
          setResult(500);
          setMessage("Something went wrong! Contact Heteroboxd support for more information!");
        }
      } else {
        setResult(401);
        setMessage("Wrong credentials! Try logging in again...");
      }
    } catch {
      setResult(500);
      setMessage("Network error! Check your internet connection...");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setEntries([]);
    setIsEnd(false);
    loadWatchlistPage(1, true);
  }, [userId]);

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect

  return (
    <View style={styles.container}>

      {!widescreen ? (
        //infinite scroll on narrow touchscreens
        <FlatList
          data={entries}
          keyExtractor={(item) => item.filmId}
          numColumns={4}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/film/${item.filmId}`)}
              style={{ margin: spacing / 2 }}
            >
              <Poster
                posterUrl={item.filmPosterUrl}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                }}
              />
            </Pressable>
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing / 2,
            paddingBottom: 80,
            marginTop: 50,
            marginBottom: 50
          }}
          onEndReached={() => {
            if (!isLoading && !isEnd) {
              loadWatchlistPage(page + 1, false);
            }
          }}
          onEndReachedThreshold={0.8}
        />
      ) : (
        //explicit pagination on web widescreens
        <>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.filmId}
            numColumns={4}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/film/${item.filmId}`)}
                style={{ margin: spacing / 2 }}
              >
                <Poster
                  posterUrl={item.filmPosterUrl}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: Colors.border_color,
                  }}
                />
              </Pressable>
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing / 2,
              paddingTop: 20,
              paddingBottom: 40,
              width: 1000,
              alignSelf: "center",
            }}
            showsVerticalScrollIndicator={false}
          />

          <PaginationBar
            numbers={Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)}
            page={page}
            onPagePress={(num) => {
              setEntries([]);
              setIsEnd(false);
              loadWatchlistPage(num, true);
            }}
          />
        </>
      )}

      <LoadingResponse visible={isLoading} />
      <Popup visible={[401, 500].includes(result)} message={message} onClose={() => result === 500 ? router.replace('/contact') : router.replace('/')} />
    </View>
  );
}

export default Watchlist

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 0,
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
})