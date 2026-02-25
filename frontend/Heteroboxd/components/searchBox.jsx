import { useState, useMemo, useRef, useEffect } from 'react'
import { KeyboardAvoidingView, StyleSheet, TextInput, View, Pressable, useWindowDimensions, Platform, ActivityIndicator } from 'react-native'
import { Colors } from '../constants/colors';
import { Snackbar } from 'react-native-paper';
import { BaseUrl } from '../constants/api';
import Fontisto from '@expo/vector-icons/Fontisto';

const SearchBox = ({ onSelected, page, pageSize }) => {
  const [query, setQuery] = useState('');
  const lastQuery = useRef('');

  const [result, setResult] = useState(-1);
  const [snack, setSnack] = useState(false);
  const [message, setMessage] = useState('');

  const { width } = useWindowDimensions();

  useEffect(() => {
    if (lastQuery.current) handleSearch();
  }, [page]);

  async function handleSearch(overridePage) {
    const q = lastQuery.current || query;
    if (!q || q.length === 0) return;
    try {
      setResult(0);
      const res = await fetch(
        `${BaseUrl.api}/films/search?Search=${q}&Page=${overridePage ?? page}&PageSize=${pageSize}`,
        { method: 'GET', headers: { Accept: 'application/json' } }
      );
      if (res.status === 200) {
        const json = await res.json();
        onSelected({items: json.items, totalCount: json.totalCount, page: json.page});
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
  }

  const widescreen = useMemo((() => Platform.OS === 'web' && width > 1000), [width]);

  return (
    <View>
      <>
        <KeyboardAvoidingView style={{flexDirection: 'row', alignSelf: 'center', justifyContent: 'center', width: widescreen ? 750 : width*0.75, marginTop: 20, marginBottom: 30}}>
          <TextInput
            style={styles.input}
            placeholder="Search films..."
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={Colors.text_placeholder}
          />
          <Pressable
            style={[{backgroundColor: Colors.heteroboxd, padding: 10, borderTopRightRadius: 10, borderBottomRightRadius: 10}, (query.length === 0) && {opacity: 0.8}]}
            disabled={query.length === 0}
            onPress={() => { lastQuery.current = query; setQuery(''); handleSearch(); }}
          >
            <Fontisto name="search" size={widescreen ? 24 : 22} color={Colors.text_button} />
          </Pressable>
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