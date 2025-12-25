import { useState, useMemo } from 'react'
import { KeyboardAvoidingView, StyleSheet, TextInput, View, TouchableOpacity, useWindowDimensions, Platform, ActivityIndicator } from 'react-native'
import { Colors } from '../constants/colors';
import { Snackbar } from 'react-native-paper';
import { BaseUrl } from '../constants/api';
import Fontisto from '@expo/vector-icons/Fontisto';

const SearchBox = ({ placeholder, context, onSelected }) => {
  const [query, setQuery] = useState('');

  const [result, setResult] = useState(-1);
  const [snack, setSnack] = useState(false);
  const [message, setMessage] = useState('');

  const { width } = useWindowDimensions();

  async function handleSearch() {
    if (!query || query.length === 0) return;
    try {
      setResult(0);
      const res = await fetch(`${BaseUrl.api}/${context}/search?Search=${query}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
      if (res.status === 200) {
        const json = await res.json();
        onSelected(json);
        setResult(200);
      } else {
        setMessage('Something went wrong! Contact Heteroboxd support for more information.');
        setResult(500);
        setSnack(true);
      }
    } catch {
      setMessage('Network error! Please check your internet connection.');
      setResult(500);
      setSnack(true);
    }
    setQuery(null); //reset query
  }

  const widescreen = useMemo((() => Platform.OS === 'web' && width > 1000), [width]);

  return (
    <View>
      <>
        <KeyboardAvoidingView style={{flexDirection: 'row', alignSelf: 'center', justifyContent: 'center', width: widescreen ? 750 : width*0.75, marginTop: 20, marginBottom: 30}}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={Colors.text_placeholder}
          />
          <TouchableOpacity
            style={[{backgroundColor: Colors._heteroboxd, padding: 10, borderTopRightRadius: 10, borderBottomRightRadius: 10}, (!query) && {opacity: 0.5}]}
            disabled={!query}
            onPress={handleSearch}
          >
            <Fontisto name="search" size={widescreen ? 24 : 22} color={Colors.text_button} />
          </TouchableOpacity>
        </KeyboardAvoidingView>
        {
          result === 0 && (
          <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={Colors.text_link} />
          </View>
          )
        }
      </>

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

export default SearchBox

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    color: Colors.text_input,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    fontSize: 16
  },
})