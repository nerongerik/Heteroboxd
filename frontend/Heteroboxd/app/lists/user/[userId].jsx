import { StyleSheet, Text, View, Platform, useWindowDimensions, FlatList, Pressable } from 'react-native'
import { Colors } from '../../../constants/colors'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useState, useEffect, useMemo } from 'react';
import PaginationBar from '../../../components/paginationBar';
import LoadingResponse from '../../../components/loadingResponse';
import Popup from '../../../components/popup';
import { BaseUrl } from '../../../constants/api';
import { Poster } from '../../../components/poster';
import { UserAvatar } from '../../../components/userAvatar';
import Fontisto from '@expo/vector-icons/Fontisto';

const UsersLists = () => {

  const { userId } = useLocalSearchParams();

  const [username, setUsername] = useState(null);
  const [avatar, setAvatar] = useState(null);
  
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const navigation = useNavigation();

  const [lists, setLists] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const loadListsPage = async (page, replace = false) => {
    try {
      if (userId) {
        setIsLoading(true);

        const res = await fetch(`${BaseUrl.api}/lists/user/${userId}?Page=${page}&PageSize=${pageSize}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        });

        if (res.status === 200) {
          const json = await res.json();
          setPage(json.page);
          setTotalCount(json.totalCount);
          setPageSize(json.pageSize);
          setLists(prev =>
            replace ? json.lists : [...prev, ...json.lists]
          );
          if (json.lists.length < json.pageSize) setIsEnd(true);
        } else if (res.status === 404) {
          setResult(404);
          setMessage("This user doesn't exist anymore!");
        } else {
          setResult(500);
          setMessage("Something went wrong! Contact Heteroboxd support for more information!");
        }
      } else {
        setResult(401);
        setMessage("Malformed parameters - what did you do?");
      }
    } catch {
      setResult(500);
      setMessage("Network error! Check your internet connection...");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setLists([]);
    setIsEnd(false);
    loadListsPage(1, true);
  }, [userId]);

  useEffect(() => {
    setUsername(lists[0]?.authorName);
    setAvatar(lists[0]?.authorProfilePictureUrl ?? null)
  }, [lists])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${username ?? "User"}'s lists`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
    });
  }, [username]);

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 30 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 800 : width * 0.9, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect

  console.log(lists);

  return (
    <View style={styles.container}>
      {!widescreen ? (
        //infinite scroll on narrow touchscreens
        <View style={{width: '95%', maxHeight: height*0.75}}>
        <FlatList
          data={lists}
          numColumns={1}
          renderItem={({ item }) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/list/${item.id}`)}
              style={{marginBottom: spacing}}
            >
              <View style={{borderBottomWidth: 2, borderTopWidth: 2, borderColor: Colors.border_color, borderRadius: 5, backgroundColor: Colors.card}}>
                <View style={{flexDirection: 'row', paddingHorizontal: 5, paddingTop: 5, alignContent: 'center'}}>
                  <UserAvatar
                    pictureUrl={avatar}
                    style={{
                      marginRight: 5,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: Colors.border_color
                    }}
                  />
                  <Text style={{color: Colors.text, fontWeight: 'bold', fontSize: 16}}>{username}</Text>
                </View>
                <Text style={{color: Colors.text_title, padding: 5, paddingTop: 0, fontWeight: '500', fontSize: 18}}>{item.name}</Text>
                <View style={{flexDirection: 'row', paddingHorizontal: 5}}>
                  {item.films.sort((a, b) => a.position - b.position).map((film, i) => (
                    <Poster
                      key={film.filmId}
                      posterUrl={film.filmPosterUrl}
                      style={{width: posterWidth, height: posterHeight, borderWidth: 2, borderColor: Colors.border_color, borderRadius: 7, marginRight: i < item.films.length - 1 ? spacing : 0}}
                    />
                  ))}
                </View>
                <Text style={{color: Colors.text, padding: 5, fontWeight: '400', fontSize: 14}}>
                  {item?.description?.slice(0, 150) + '...' ?? null}
                </Text>
                <View style={{flexDirection: 'row', alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                  <Fontisto name="nav-icon-list-a" size={14} color={Colors._heteroboxd} />
                  <Text style={{color: Colors._heteroboxd, fontSize: 14, fontWeight: 'bold', marginRight: 10, marginLeft: 3}}>{item.films.length}</Text>
                  <Fontisto name="heart" size={14} color={Colors.heteroboxd} />
                  <Text style={{color: Colors.heteroboxd, fontSize: 14, fontWeight: 'bold', marginLeft: 3, marginBottom: 5}}>{item.likeCount}</Text>
                </View>
              </View>
            </Pressable>
          )}
          contentContainerStyle={{
            alignItems: 'left',
            minWidth: maxRowWidth
          }}
          onEndReached={() => {
            if (!isLoading && !isEnd) {
              loadListsPage(page + 1, false);
            }
          }}
          onEndReachedThreshold={0.8}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        />
        </View>
      ) : (
        //explicit pagination on web widescreens
        <View style={{width: 1000, maxHeight: height*0.75}}>
          <FlatList
            data={lists}
            numColumns={1}
            renderItem={({ item }) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/list/${item.id}`)}
                style={{marginBottom: spacing/2}}
              >
                <View style={{borderBottomWidth: 2, borderTopWidth: 2, borderColor: Colors.border_color, borderRadius: 5, backgroundColor: Colors.card}}>
                <View style={{flexDirection: 'row', paddingHorizontal: 5, paddingTop: 5, alignContent: 'center'}}>
                  <UserAvatar
                    pictureUrl={avatar}
                    style={{
                      marginRight: 5,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: Colors.border_color
                    }}
                  />
                  <Text style={{color: Colors.text, fontWeight: 'bold', fontSize: 20}}>{username}</Text>
                </View>
                <Text style={{color: Colors.text_title, padding: 5, paddingTop: 0, fontWeight: '500', fontSize: 28}}>{item.name}</Text>
                  <View style={{flexDirection: 'row', paddingHorizontal: 5}}>
                    {item.films.sort((a, b) => a.position - b.position).map((film, i) => (
                      <Poster
                        key={film.filmId}
                        posterUrl={film.filmPosterUrl}
                        style={{width: posterWidth, height: posterHeight, borderWidth: 2, borderColor: Colors.border_color, borderRadius: 7, marginRight: i < item.films.length - 1 ? spacing : 0}}
                      />
                    ))}
                  </View>
                <Text style={{color: Colors.text, padding: 5, fontWeight: '400', fontSize: 16}}>
                  {item?.description.slice(0, 500) + '...' ?? null}
                </Text>
                <View style={{flexDirection: 'row', alignSelf: 'center', alignItems: 'center', justifyContent: 'center'}}>
                  <Fontisto name="nav-icon-list-a" size={20} color={Colors._heteroboxd} />
                  <Text style={{color: Colors._heteroboxd, fontSize: 18, fontWeight: 'bold', marginRight: 10, marginLeft: 3}}>{item.films.length}</Text>
                  <Fontisto name="heart" size={20} color={Colors.heteroboxd} />
                  <Text style={{color: Colors.heteroboxd, fontSize: 18, fontWeight: 'bold', marginLeft: 3, marginBottom: 5}}>{item.likeCount}</Text>
                </View>
                </View>
              </Pressable>
            )}
            contentContainerStyle={{
              alignItems: 'left',
              minWidth: maxRowWidth,
            }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />

          <PaginationBar
            numbers={Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)}
            page={page}
            onPagePress={(num) => {
              setLists([]);
              setIsEnd(false);
              loadListsPage(num, true);
            }}
          />
        </View>
      )}

      <LoadingResponse visible={isLoading} />
      <Popup visible={[401, 404, 500].includes(result)} message={message} onClose={() => result === 500 ? router.replace('/contact') : router.replace('/')} />
    </View>
  )
}

export default UsersLists

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
    overflow: 'hidden',
  },
})