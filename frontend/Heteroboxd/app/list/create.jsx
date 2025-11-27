import { ScrollView, StyleSheet, useWindowDimensions, View, Platform, TextInput, Text, Pressable, FlatList, TouchableOpacity } from 'react-native'
import { useAuth } from '../../hooks/useAuth';
import { useMemo, useState } from 'react';
import { Colors } from '../../constants/colors';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Poster } from '../../components/poster';

const CreateList = () => {
  const { user, isValidSession } = useAuth();
  const {width} = useWindowDimensions();
  
  const [listName, setListName] = useState(null);
  const [desc, setDesc] = useState(null);
  const [entries, setEntries] = useState([]);
  const [ranked, setRanked] = useState(false);

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
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
    //send fetch call for list create
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, {minWidth: widescreen ? 1000 : 'auto', maxWidth: widescreen ? 1000 : "100%", width: "100%",}]}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.input}
          placeholder="List name*"
          value={listName}
          onChangeText={setListName}
          placeholderTextColor={Colors.text_placeholder}
        />
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="List description (optional)"
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={3}
          placeholderTextColor={Colors.text_placeholder}
        />
        <Pressable onPress={() => setRanked(prev => !prev)} style={{alignItems: 'center', padding: 10}}>
          <FontAwesome5 name="trophy" size={45} color={ranked ? Colors.heteroboxd : Colors.text} />
          <Text style={{textAlign: 'center', fontSize: 22, color: ranked ? Colors.heteroboxd : Colors.text}}>Ranked{!ranked ? "?" : ""}</Text>
        </Pressable>
        <View style={{padding: 5}}>
          <Pressable onPress={openSearchPopup}>
            <Text style={{fontSize: 16, color: Colors.heteroboxd}}>Add entries...</Text>
          </Pressable>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.filmId.toString()}
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
                        lineHeight: 18, // slightly less than height for perfect optical centering
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
            contentContainerStyle={{
              paddingHorizontal: spacing / 2,
              paddingBottom: 80,
              marginTop: 50,
              marginBottom: 50,
              width: widescreen ? 1000 : '100%',
              alignSelf: 'center'
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <View style={{alignSelf: 'center', alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'center'}}>
            <TouchableOpacity style={{backgroundColor: Colors.button_reject, borderRadius: 5, padding: 10, marginRight: 35}} onPress={user?.userId ? router.navigate(`/profile/${user.userId}`) : router.navigate('/')}>
              <Text style={{color: Colors.text_button, fontSize: 20}}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{backgroundColor: Colors.button_confirm, borderRadius: 5, padding: 10}, (!listName || entries.length === 0) && {opacity: 0.5}]} disabled={!listName || entries.length === 0} onPress={handleSubmit}>
              <Text style={{color: Colors.text_button, fontSize: 20}}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default CreateList

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 , alignSelf: 'center'},
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 15,
    color: Colors.text_input,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  bioInput: { minHeight: 80, textAlignVertical: 'top', padding: 5 },
})