import { StyleSheet, useWindowDimensions, View, Platform, TextInput, Text, Pressable, FlatList } from 'react-native'
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

const CreateList = () => {
  const { user, isValidSession } = useAuth();
  const {width, height} = useWindowDimensions();
  
  const [listName, setListName] = useState(null);
  const [desc, setDesc] = useState(null);
  const [entries, setEntries] = useState([]);
  const [ranked, setRanked] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  const [result, setResult] = useState(-1);
  const [snack, setSnack] = useState(false);
  const [message, setMessage] = useState('');

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

  async function openSearchPopup() {
    /*
    right now, this simply has to be a placeholder, as we don't have ANY search functionality right now
    in essence it really should be a simple input field where a user can enter a movie name, call the same
    search endpoint as the main search component will, display a (in some way) more lightweight matches
    clicking on any of them simply pushes the selected simplified object {filmId, posterUrl} into entries
    */
    console.log("I am too lazy to implement this properly right now. Here's a few cherry-picked entry from our db instead...");
    setEntries(prev => [...prev, 
      {filmId: 11, posterUrl: 'https://image.tmdb.org/t/p/original/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg'},
      {filmId: 769, posterUrl: 'https://image.tmdb.org/t/p/original/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg'},
      {filmId: 1893, posterUrl: 'https://image.tmdb.org/t/p/original/6wkfovpn7Eq8dYNKaG5PY3q2oq6.jpg'},
      {filmId: 307182, posterUrl: 'https://image.tmdb.org/t/p/original/m6VFdVSlLY7tGrMU1fGQ0QePuZT.jpg'},
      {filmId: 307184, posterUrl: 'https://image.tmdb.org/t/p/original/9ROWoiU2FAKRLASHZefchRfoiFG.jpg'},
      {filmId: 307185, posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'},
      {filmId: 307186, posterUrl: 'https://image.tmdb.org/t/p/original/vlVzxXdbTu1xQmWsP0JinezA4Fm.jpg'},
      {filmId: 307187, posterUrl: 'https://image.tmdb.org/t/p/original/sAaxm97MM9ZNXOPtqrJXRvV5pnq.jpg'},
    ]);
  }

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
      <View style={{width: widescreen ? 1000 : '95%', alignSelf: 'center', marginBottom: Platform.OS === 'web' ? 10 : 50}}>
        <TextInput
          style={[styles.input, {marginBottom: 15}]}
          placeholder="List name*"
          value={listName}
          onChangeText={setListName}
          placeholderTextColor={Colors.text_placeholder}
        />
        <TextInput
          style={[styles.input, styles.bioInput, {marginBottom: 10}]}
          placeholder="Description (optional)"
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={3}
          placeholderTextColor={Colors.text_placeholder}
        />
        <Pressable onPress={openSearchPopup} style={{flexDirection: 'row', alignContent: 'center', alignItems: 'center', marginTop: 15, paddingHorizontal: 15}}>
          <Text style={{fontSize: widescreen ? 20 : 16, color: Colors.heteroboxd}}>Films {' '}</Text>
          <AntDesign name="plus-circle" size={widescreen ? 24 : 18} color={Colors.heteroboxd} />
        </Pressable>
      </View>
      <View style={[styles.entryContainer, {minHeight: widescreen ? height/2 : height/3, maxHeight: widescreen ? height/2 : height/3, width: maxRowWidth}]}> 
        <FlatList
          data={entries}
          numColumns={4}
          renderItem={({ item, index }) => (
            <Pressable key={index} onPress={() => { setEntries(prev => prev.filter((_, i) => i !== index)); }} style={{alignItems: 'center'}}>
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

      <LoadingResponse visible={result === 0} />
      <Snackbar
        visible={snack}
        onDismiss={() => setSnack(false)}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? '50%' : '90%',
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

export default CreateList

const styles = StyleSheet.create({
  container: {backgroundColor: Colors.background, flex: 1, justifyContent: 'center'},
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    color: Colors.text_input,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    fontSize: 16
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top', padding: 5 },
  entryContainer: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Colors.border_color,
    borderRadius: 8,
    overflow: 'hidden',
  }
})