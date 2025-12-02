import { useLocalSearchParams, useRouter } from 'expo-router'
import { Platform, StyleSheet, useWindowDimensions, View, FlatList, Pressable, Text, RefreshControl } from 'react-native'
import { Colors } from '../../constants/colors';
import { useEffect, useMemo, useState } from 'react';
import { BaseUrl } from '../../constants/api';
import LoadingResponse from '../../components/loadingResponse';
import Popup from '../../components/popup';
import PaginationBar from '../../components/paginationBar';
import { Backdrop } from '../../components/backdrop';
import { Poster } from '../../components/poster';
import {UserAvatar} from '../../components/userAvatar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as auth from '../../helpers/auth';
import { useAuth } from '../../hooks/useAuth';

const List = () => {
  const { listId } = useLocalSearchParams();

  const { user, isValidSession } = useAuth();

  const router = useRouter();
  const { width } = useWindowDimensions();

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const [baseList, setBaseList] = useState(null); //"header," basically just the list metadata without films
  const [likeCountLocalCopy, setLikeCountLocalCopy] = useState(0);
  const [iLiked, setILiked] = useState(false);

  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); //unlikely that lists will be too big, make it easier for network
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const loadBaseList = async () => {
    try {
      setResult(0);
      const res = await fetch(`${BaseUrl.api}/lists/${listId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      if (res.status === 200) {
        const json = await res.json();
        setBaseList(json);
        setLikeCountLocalCopy(Number(json.likeCount));
        setResult(200);
      } else if (res.status === 404) {
        setResult(404);
        setMessage("This list no longer exists!");
      } else {
        setResult(500);
        setMessage("Something went wrong! Contact Heteroboxd support for more information!");
      }
    } catch {
      setResult(500);
      setMessage("Network error! Please check your internet connection.")
    }
  }

  const loadListPage = async (page, replace = false) => {
    if (!baseList) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${BaseUrl.api}/lists/entries/${baseList.id}?Page=${page}&PageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
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
    } catch {
      setResult(500);
      setMessage("Network error! Check your internet connection...");
    } finally {
      setIsLoading(false);
    }
  };

  const loadLiked = async () => {
    if (!user || !isValidSession) return;
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/${user.userId}/liked/${listId}?ObjectType=list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status === 200) {
        const json = await res.json();
        setILiked(json);
      } else {
        console.log('Is List Liked FAILED: ' + res.status);
      }
    } catch {
      console.log('Network error');
    }
  }
  
  useEffect(() => {
    loadBaseList();
  }, [listId]);

  useEffect(() => {
    setEntries([]);
    setIsEnd(false);
    loadListPage(1, true);
  }, [baseList]);

  useEffect(() => {
    loadLiked();
  }, [listId, user])

  const handleLike = async () => {
    if (!user || !isValidSession) return;
    try {
      const likeChange = iLiked ? -1 : 1
      setLikeCountLocalCopy(prev => prev + likeChange);
      setILiked(prev => !prev);
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists/like-count/${listId}/${likeChange}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status !== 200) console.log("Update List FAILED w/" + res.status);
      const uRes = await fetch(`${BaseUrl.api}/users/likes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          UserId: user.userId,
          ReviewId: null,
          CommentId: null,
          ListId: listId
        })
      });
      if (uRes.status !== 200) console.log("Update User FAILED w/" + uRes.status);
    } catch {
      console.log("Network error.")
    }
  }

  const openDescMenu = async () => {

  }

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect
  //cache backdrop
  const MemoBackdrop = useMemo(() => <Backdrop backdropUrl={entries[0]?.filmBackdropUrl} narrow={true} />, [widescreen, entries])

  return (
    <View style={styles.container}>
      {MemoBackdrop}
      <View style={{width: widescreen ? 1000 : '95%'}}>
        <Pressable onPress={(e) => {
          e.stopPropagation();
          router.push(`/profile/${userId}`)
        }}>
          <View style={{flexDirection: 'row', paddingTop: 5, alignItems: 'center'}}>
            <UserAvatar
              pictureUrl={baseList?.authorProfilePictureUrl}
              style={{
                marginRight: 5,
                width: widescreen ? 36 : 26,
                height: widescreen ? 36 : 26,
                borderRadius: widescreen ? 18 : 13,
                borderWidth: 2,
                borderColor: Colors.border_color
              }}
            />
            <Text style={{color: Colors.text, fontWeight: 'bold', fontSize: widescreen ? 20 : 16}}>{baseList?.authorName}</Text>
          </View>
        </Pressable>
        <Text style={{fontSize: widescreen ? 24 : 22, color: Colors.text_title, fontWeight: '600', marginBottom: 3}}>{baseList?.name}</Text>
        <Pressable onPress={openDescMenu}>
            { baseList?.description?.length > 300 ? (
                <Text style={{fontSize: widescreen ? 18 : 14, color: Colors.text, fontWeight: '400'}}>
                  {widescreen ? baseList.description.slice(0, 300) : baseList.description.slice(0, 150)}<Text style={{color: Colors.text_title}}>...</Text>
                </Text>
              ) : (
                <Text style={{fontSize: widescreen ? 18 : 14, color: Colors.text, fontWeight: '400'}}>
                  {baseList?.description}
                </Text>
              )
            }
        </Pressable>
        <Pressable onPress={handleLike} style={{flexDirection: 'row', alignItems: 'center', marginTop: 5}}>
          { iLiked ? (
            <MaterialCommunityIcons style={{marginRight: 3}} name="cards-heart" size={widescreen ? 24 : 20} color={Colors.heteroboxd} />
          ) : (
            <MaterialCommunityIcons name="cards-heart-outline" size={widescreen ? 24 : 20} color={Colors.text} />
          )}
          <Text style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: 'bold', marginLeft: 3}}>{likeCountLocalCopy} likes</Text>
        </Pressable>
      </View>
      {!widescreen ? (
        //infinite scroll on narrow touchscreens
        <FlatList
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => {
              setEntries([]);
              loadListPage(1);
            }}/>}
          data={entries}
          keyExtractor={(item) => item.filmId}
          numColumns={4}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/film/${item.filmId}`)}
              style={{ margin: spacing / 2, marginBottom: 0, alignItems: 'center' }}
            >
              <Poster
                posterUrl={item.filmPosterUrl}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                  marginBottom: baseList?.ranked ? 0 : spacing / 2
                }}
              />
              {baseList?.ranked && (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 9999,
                    backgroundColor: Colors.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: spacing / 2,
                    marginTop: -10,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.text_title,
                      fontSize: 8,
                      fontWeight: 'bold',
                      lineHeight: 18,
                    }}
                  >
                    {item.position}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing / 2,
            paddingBottom: 80,
            marginTop: 10,
            marginBottom: 50
          }}
          onEndReached={() => {
            if (!isLoading && !isEnd) {
              loadListPage(page + 1, false);
            }
          }}
          onEndReachedThreshold={0.8}
          showsVerticalScrollIndicator={false}
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
                style={{ margin: spacing / 2, marginBottom: 0, alignItems: 'center' }}
              >
                <Poster
                  posterUrl={item.filmPosterUrl}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: Colors.border_color,
                    marginBottom: baseList?.ranked ? 0 : spacing / 2
                  }}
                />
                {baseList?.ranked && (
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9999,
                      backgroundColor: Colors.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: spacing / 2,
                      marginTop: -10,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.text_title,
                        fontSize: 12,
                        fontWeight: 'bold',
                        lineHeight: 18,
                      }}
                    >
                      {item.position}
                    </Text>
                  </View>
                )}
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
              loadListPage(num, true);
            }}
          />
        </>
      )}

      <LoadingResponse visible={result === 0} />
      <Popup visible={[404, 500].includes(result)} message={message} onClose={() => result === 500 ? router.replace('/contact') : router.replace('/')} />
    </View>
  )
}

export default List

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
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