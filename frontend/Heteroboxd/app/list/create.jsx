import { StyleSheet, useWindowDimensions, View, Platform, TextInput, Text, Pressable, FlatList, Modal, Animated } from 'react-native'
import { useAuth } from '../../hooks/useAuth';
import { useMemo, useState, useEffect } from 'react';
import { Colors } from '../../constants/colors';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Poster } from '../../components/poster';
import { useRouter, useNavigation } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as auth from '../../helpers/auth';
import { BaseUrl } from '../../constants/api';
import LoadingResponse from '../../components/loadingResponse';
import { Snackbar } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import SearchBox from '../../components/searchBox';

const CreateList = () => {
  const { user, isValidSession } = useAuth();
  const {width, height} = useWindowDimensions();
  
  const [listName, setListName] = useState(null);
  const [desc, setDesc] = useState('');
  const [entries, setEntries] = useState([]);
  const [ranked, setRanked] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  const [result, setResult] = useState(-1);
  const [snack, setSnack] = useState(false);
  const [message, setMessage] = useState('');

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep

  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit} disabled={!listName || entries.length === 0} style={(!listName || entries.length === 0) && {opacity: 0.5}}>
          <Ionicons name="checkmark" size={24} color={Colors.text_title} />
        </TouchableOpacity>
      )
    });
  }, [listName, desc, entries, ranked]);

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 5) / 4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect

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

  async function handleSubmit() {
    try {
      if (!user || !isValidSession()) {
        //snackbar
        return;
      }
      setResult(0);
      const payload = entries.map((e, i) => ({
        FilmId: e.filmId,
        Position: i + 1
      }));
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          "Name": listName,
          "Description": desc,
          "Ranked": ranked,
          "AuthorId": user.userId,
          "Entries": payload
        })
      });
      if (res.status === 200) {
        setResult(200);
        router.replace(`/lists/user/${user.userId}`);
      } else if (res.status === 401) {
        setMessage("Credentials expired - try logging in again!");
        setResult(401);
        setSnack(true);
      } else {
        console.log(res.status)
        setMessage("Something went wrong! Contact Heteroboxd support for more information.");
        setResult(500);
        setSnack(true);
      }
    } catch {
        setMessage("Network error! Please check your internet connection.");
        setResult(500);
        setSnack(true);
      return;
    }
  }

  return (
    <View style={[styles.container]}>
      <View style={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
        <TextInput
          style={[styles.input, {marginBottom: 15}]}
          placeholder="List name*"
          value={listName}
          onChangeText={setListName}
          placeholderTextColor={Colors.text_placeholder}
        />
        <View style={styles.descWrapper}>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Description (optional)"
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholderTextColor={Colors.text_placeholder}
          />
          <Text style={[
            styles.counterText,
            { color: desc.length < 1001 ? Colors.text_title : Colors.password_meager }
          ]}>
            {desc.length}/1000
          </Text>
        </View>
      </View>
      <View style={{width: widescreen ? 990 : width*0.9, alignSelf: 'center'}}>
        <Pressable onPress={openMenu} style={{flexDirection: 'row', alignItems: 'center', marginBottom: 3}}>
          <Text style={{fontSize: widescreen ? 20 : 16, color: Colors.heteroboxd}}>Films </Text>
          <AntDesign name="plus-circle" size={widescreen ? 20 : 16} color={Colors.heteroboxd} />
        </Pressable>
      </View>
      <View style={[styles.entryContainer, {minHeight: widescreen ? height/2 : height/3, maxHeight: widescreen ? height/2 : height/3, width: maxRowWidth}]}> 
        <FlatList
          data={entries}
          numColumns={4}
          renderItem={({ item, index }) => (
            <Pressable key={index} onPress={() => {setEntries(prev => prev.filter((_, i) => i !== index)); }} style={{alignItems: 'center'}}>
              <Poster
                posterUrl={item.posterUrl}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                  marginBottom: ranked ? 0 : spacing
                }}
              />
              {ranked && (
                <View
                  style={{
                    width: widescreen ? 28 : 20,
                    height: widescreen ? 28 : 20,
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
                      fontSize: widescreen ? 12 : 8,
                      fontWeight: 'bold',
                      lineHeight: 18,
                    }}
                  >
                    {index + 1}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          contentContainerStyle={{
            padding: spacing,
            alignItems: 'center'
          }}
          columnWrapperStyle={{
            columnGap: spacing,
            rowGap: spacing,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Pressable onPress={() => setRanked(prev => !prev)} style={{alignItems: 'center', marginTop: 5}}>
        <FontAwesome5 name="trophy" size={widescreen ? 40 : 30} color={ranked ? Colors.heteroboxd : Colors.text} />
        <Text style={{textAlign: 'center', fontSize: widescreen ? 20 : 16, color: ranked ? Colors.heteroboxd : Colors.text}}>Ranked</Text>
      </Pressable>

      <Modal transparent visible={menuShown} animationType="fade">
        <Pressable style={styles.overlay} onPress={() => {
          setSearchResults(null);
          closeMenu();
        }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
        </Pressable>

        <Animated.View style={[styles.menu, { transform: [{ translateY }], width: widescreen ? '50%' : width, alignSelf: 'center' }]}>
          <SearchBox placeholder={"Search Films..."} context={'films'} onSelected={(json) => setSearchResults(json)} />
          {
            (searchResults && searchResults.length > 0) ? (
              <View style={[styles.entryContainer, {minHeight: height/3, maxHeight: height/3, width: width*0.95}]}>
              <FlatList
                data={searchResults}
                numColumns={1}
                renderItem={({item, index}) => (
                  <Pressable key={index} onPress={() => {
                    if (!entries.some(e => e.filmId === item.filmId)) setEntries(prev => [...prev, { filmId: item.filmId, posterUrl: item.posterUrl }]);
                    setSearchResults(null);
                    closeMenu();
                  }}>
                    <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
                      <Poster posterUrl={item.posterUrl} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} />
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
        </Animated.View>
      </Modal>

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
        {message}
      </Snackbar>

    </View>
  )
}

export default CreateList;


const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center'
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
  entryContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderColor: Colors.border_color,
    borderRadius: 5,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    marginBottom: 8,
    overflow: 'hidden'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject
  },
  menu: {
    backgroundColor: Colors.card,
    bottom: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 8,
    position: 'absolute'
  }
});
