import { Platform, StyleSheet, Text, TextInput, useWindowDimensions, View, TouchableOpacity, Pressable, FlatList, Animated } from 'react-native'
import { useAuth } from '../../../hooks/useAuth';
import * as auth from '../../../helpers/auth';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { Colors } from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { BaseUrl } from '../../../constants/api';
import { Snackbar } from 'react-native-paper';
import LoadingResponse from '../../../components/loadingResponse';
import Popup from '../../../components/popup';
import { Poster } from '../../../components/poster';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import SearchBox from '../../../components/searchBox';
import SlidingMenu from '../../../components/slidingMenu';

const EditList = () => {
  const { listId } = useLocalSearchParams();
  const { user, isValidSession } = useAuth();

  const [listName, setListName] = useState('');
  const [desc, setDesc] = useState('');
  const [ranked, setRanked] = useState(false);
  const [entries, setEntries] = useState(null);

  const router = useRouter();
  const navigation = useNavigation();

  const { width, height } = useWindowDimensions();

  const [result, setResult] = useState(-1);
  const [snack, setSnack] = useState(false);
  const [msg, setMsg] = useState('');

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const [searchResults, setSearchResults] = useState(null);

  const loadList = async () => {
    const vS = await isValidSession();
    if (!user || !vS) {
      setPopupMsg('Session expired! Try logging in again.');
      setEntries([]);
      setPopupVisible(true);
      return;
    }
    try {
      //list metadata
      const resBase = await fetch(`${BaseUrl.api}/lists/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (resBase.status !== 200) {
        setPopupMsg(`${resBase.status}: Failed to fetch list metadata! Try again later.`);
        setEntries([]);
        setPopupVisible(true);
        return;
      }
      const jsonBase = await resBase.json();
      setListName(jsonBase.name);
      setDesc(jsonBase.description);
      setRanked(jsonBase.ranked);
      //list entries
      const jwt = await auth.getJwt();
      const resEntries = await fetch(`${BaseUrl.api}/lists/power/${listId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (resEntries.status !== 200) {
        setPopupMsg(`${resEntries.status}: Failed to fetch entries! Try again later.`);
        setEntries([]);
        setPopupVisible(true);
        return;
      }
      const jsonEntries = await resEntries.json();
      setEntries(jsonEntries);
    } catch {
        setPopupMsg(`Network error! Check your internet connection.`);
        setEntries([]);
        setPopupVisible(true);
        return;
    }
  }

  useEffect(() => {
    loadList();
  }, [listId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit} disabled={listName.length === 0 || entries?.length === 0} style={(listName.length === 0 || entries?.length === 0) && {opacity: 0.5}}>
          <Ionicons name="checkmark" size={24} color={Colors.text_title} />
        </TouchableOpacity>
      )
    });
  }, [listName, desc, ranked, entries]);

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

  function moveItem(index, direction) {
    setEntries(prev => {
      const newArr = [...prev];
      const target = index + direction;

      if (target < 0 || target >= newArr.length) return prev;

      [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
      return newArr;
    });
  }

  function deleteItem(index) {
    setEntries(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setResult(0);
    const vS = await isValidSession();
    if (!user || !vS) {
      setResult(401);
      router.replace('/login');
    }
    try {
      const cler = entries?.map((e, i) => ({
        FilmId: e.filmId,
        Position: i + 1
      }));
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          ListId: listId,
          Name: listName,
          Description: desc,
          Ranked: ranked,
          Entries: cler
        })
      });
      if (res.status === 200) {
        setResult(200);
        router.replace(`lists/user/${user.userId}`);
      } else {
        setResult(res.status);
        setMsg(`${res.status}: Failed to update list! Try reloading Heteroboxd.`);
        setSnack(true);
      }
    } catch {
      setMsg('Network error - check your internet connection.');
      setSnack(true);
      setResult(500);
    }
  }

  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  const posterWidth = useMemo(() => widescreen ? 150 : 75, [widescreen]);
  const posterHeight = useMemo(() => posterWidth*3/2, [posterWidth]);

  if (!entries) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 5,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    );
  }

  const Header = () => (
    <>
      <View style={{width: widescreen ? 1000 : width*0.9, alignSelf: 'center',}}>
        <Text style={{color: Colors.text_title, fontSize: widescreen ? 30 : 20, textAlign: 'center', fontWeight: '500', marginBottom: 25}}>Edit List</Text>
        <TextInput
          style={[styles.input, {marginBottom: 15}]}
          value={listName}
          onChangeText={setListName}
          placeholderTextColor={Colors.text_placeholder}
          placeholder='List name*'
        />
        <View style={[styles.descWrapper, {marginBottom: 15}]}>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholderTextColor={Colors.text_placeholder}
            placeholder='Description (optional)'
          />
          <Text style={[
            styles.counterText,
            { color: desc.length < 1001 ? Colors.text_title : Colors.password_meager }
          ]}>
            {desc.length}/1000
          </Text>
        </View>
        <Pressable onPress={() => setRanked(prev => !prev)} style={{alignItems: 'center'}}>
          <FontAwesome5 name="trophy" size={widescreen ? 30 : 20} color={ranked ? Colors.heteroboxd : Colors.text} />
          <Text style={{textAlign: 'center', fontSize: widescreen ? 16 : 12, color: ranked ? Colors.heteroboxd : Colors.text}}>Ranked</Text>
        </Pressable>
      </View>
    </>
  )

  const Render = ({item, index}) => (
    <View style={{flexDirection: 'row', alignSelf: 'center', alignItems: 'center', width: '100%', justifyContent: 'space-between'}}>
      <View style={[styles.card, {width: widescreen ? '95%' : '90%'}]}>
        <Poster posterUrl={item.filmPosterUrl} style={{marginRight: 3, borderWidth: 2, borderRadius: 4, borderColor: Colors.border_color, width: posterWidth, height: posterHeight}} other={true} />
        <View style={{flexShrink: 1, maxWidth: '100%'}}>
          <Text style={{color: Colors.text_title, fontWeight: '600', fontSize: widescreen ? 24 : 16, textAlign: 'center'}}>
            {item.filmTitle}
            <Text style={{color: Colors.text, fontWeight: '400', fontSize: widescreen ? 20 : 12}}> {item.filmYear}</Text>
          </Text>
        </View>
        <View style={{ gap: 5, marginLeft: 3 }}>
          <Pressable onPress={() => moveItem(index, -1)}>
            <MaterialIcons name="keyboard-arrow-up" size={28} color={Colors.text_title} />
          </Pressable>
          <Pressable onPress={() => moveItem(index, +1)}>
            <MaterialIcons name="keyboard-arrow-down" size={28} color={Colors.text_title} />
          </Pressable>
        </View>
      </View>
      <Pressable onPress={() => deleteItem(index)}>
        <FontAwesome5 name="trash" size={20} color={Colors.text} />
      </Pressable>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.filmId.toString()}
        ListHeaderComponent={Header}
        renderItem={Render}
        ListEmptyComponent={<Text style={{textAlign: 'center', color: Colors.text, padding: 50, fontSize: widescreen ? 20 : 16}}>No entries.</Text>}
        contentContainerStyle={{
          width: widescreen ? 1000 : width*0.9,
          alignSelf: 'center',
          gap: 10,
          paddingBottom: widescreen ? null : 100
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={openMenu}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <LoadingResponse visible={result === 0} />
      <Snackbar
        visible={snack}
        onDismiss={() => setSnack(false)}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? width*0.5 : width*0.9,
          alignSelf: 'center',
          borderRadius: 8,
        }}
        action={{
          label: 'OK',
          onPress: () => setSnack(false),
          textColor: Colors.text_link
        }}
      >
        {msg}
      </Snackbar>
      <Popup visible={popupVisible} message={popupMsg} onClose={() => router.replace('/')} />

      <SlidingMenu menuShown={menuShown} closeMenu={() => {setSearchResults(null); closeMenu();}} translateY={translateY} widescreen={widescreen} width={width}>
        <SearchBox placeholder={"Search Films..."} context={'films'} onSelected={(json) => setSearchResults(json)} />
        {
          (searchResults && searchResults.length > 0) ? (
            <View style={[styles.entryContainer, {minHeight: height/3, maxHeight: height/3, width: width*0.95}]}>
            <FlatList
              data={searchResults}
              numColumns={1}
              renderItem={({item, index}) => (
                <Pressable key={index} onPress={() => {
                  if (!entries.some(e => e.filmId === item.filmId)) setEntries(prev => [...prev, { filmId: item.filmId, filmPosterUrl: item.posterUrl, filmTitle: item.title, filmYear: item.releaseYear }]);
                  setSearchResults(null);
                  closeMenu();
                }}>
                  <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
                    <Poster posterUrl={item.posterUrl} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} other={true} />
                    <View style={{flexShrink: 1, maxWidth: '100%'}}>
                      <Text style={{color: Colors.text_title, fontSize: 16}} numberOfLines={3} ellipsizeMode="tail">
                        {item.title} <Text style={{color: Colors.text, fontSize: 14}}>{item.releaseYear}</Text>
                      </Text>
                      <Text style={{color: Colors.text, fontSize: 12}}>Directed by {
                        item.castAndCrew?.map((d, i) => (
                          <Text key={i} style={{}}>
                            {d.celebrityName ?? ""}{i < item.castAndCrew.length - 1 && ", "}
                          </Text>
                        ))
                      }</Text>
                    </View>
                  </View>
                </Pressable>
              )}
              contentContainerStyle={{
                padding: 20,
                alignItems: 'flex-start',
                width: '100%'
              }}
              showsVerticalScrollIndicator={false}
            />
            </View>
          ) : (searchResults && searchResults.length === 0) && (
            <Text style={{padding: 20, alignSelf: 'center', color: Colors.text, fontSize: 16}}>We found no records matching your query.</Text>
          )
        }
      </SlidingMenu>
    </View>
  )
}

export default EditList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
    paddingBottom: 50
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 5,
    padding: 10,
    borderWidth: 2,
    borderColor: Colors.border_color,
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 75,
    right: 20,
    zIndex: 999,
    backgroundColor: Colors._heteroboxd,
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, //android
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, //iOS
  },
  descWrapper: {
    marginBottom: 10,
    maxHeight: 80,
    minHeight: 80,
    position: 'relative',
    width: '100%'
  },
  input: {
    backgroundColor: 'transparent',
    borderColor: Colors.border_color,
    borderRadius: 10,
    borderWidth: 1.5,
    color: Colors.text_input,
    fontSize: 16,
    height: 45,
    paddingHorizontal: 12,
    width: '100%',
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  bioInput: {
    flex: 1,
    includeFontPadding: false,
    maxHeight: 80,
    minHeight: 80,
    padding: 10,
    textAlignVertical: 'top',
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  counterText: {
    bottom: 6,
    fontSize: 14,
    position: 'absolute',
    right: 8
  },
})