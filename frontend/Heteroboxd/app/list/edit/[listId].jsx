import { StyleSheet, useWindowDimensions, View, Platform, TextInput, Text, Pressable, ScrollView } from 'react-native'
import { useAuth } from '../../../hooks/useAuth';
import { useMemo, useState, useEffect } from 'react';
import { Colors } from '../../../constants/colors';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as auth from '../../../helpers/auth';
import { BaseUrl } from '../../../constants/api';
import LoadingResponse from '../../../components/loadingResponse';
import { Snackbar } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';

const EditList = () => {
  const {listId} = useLocalSearchParams();
  const { user, isValidSession } = useAuth();
  const {width} = useWindowDimensions();

  const [listName, setListName] = useState('');
  const [desc, setDesc] = useState('');
  const [ranked, setRanked] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  const [result, setResult] = useState(-1);
  const [snack, setSnack] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/lists/${listId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (res.status === 200) {
          const json = await res.json();
          setListName(json.name);
          setDesc(json.description);
          setRanked(json.ranked);
        } else {
          setMessage(`${res.status}: Failed to fetch list information. Perhaps it no longer exists?`);
          setSnack(true);
        }
      } catch {
        setMessage("Network error - check your internet connection.")
        setSnack(true);
      }
    })();
  }, [listId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit} disabled={!listName} style={(!listName) && {opacity: 0.5}}>
          <Ionicons name="checkmark" size={24} color={Colors.text_title} />
        </TouchableOpacity>
      )
    });
  }, [listName, desc, ranked]);

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);

  async function handleSubmit() {
    if (!user || !isValidSession()) {
      setMessage("Session expired. Try logging in again!");
      setSnack(true); 
    }
    try {

    } catch {
      setMessage("Network error - check your internet connection.");
      setSnack(true);
    }
    setResult(0);
    const jwt = await auth.getJwt();
    const res = await fetch(`${BaseUrl.api}/lists`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        ListId: listId,
        Name: listName,
        Description: desc ?? '',
        Ranked: ranked,
        Entries: null
      })
    });
    if (res.status === 200) {
      setResult(200);
      router.replace(`list/${listId}`);
    } else {
      setResult(res.status);
      setMessage(`${res.status}: Failed to update list. Try reloading Heteroboxd.`);
      setSnack(true);
    }
  }

  async function handleEntries() {
    await handleSubmit();
    router.push(`/list/edit-entries/${listId}`);
  }

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
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
        <Pressable onPress={handleEntries} style={{marginBottom: 10, padding: widescreen ? 100 : 50, alignItems: 'center', alignContent: 'center', backgroundColor: Colors.card, borderRadius: 5, borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color}}>
          <Text style={{fontSize: widescreen ? 20 : 16, color: Colors.text_title, textAlign: 'center'}}>Remove, add, or reorder entries...</Text>
          <MaterialIcons name="edit" size={widescreen ? 24 : 20} color={Colors.text_title} />
        </Pressable>
        <Pressable onPress={() => setRanked(prev => !prev)} style={{alignItems: 'center'}}>
          <FontAwesome5 name="trophy" size={widescreen ? 40 : 30} color={ranked ? Colors.heteroboxd : Colors.text} />
          <Text style={{textAlign: 'center', fontSize: widescreen ? 20 : 16, color: ranked ? Colors.heteroboxd : Colors.text}}>Ranked</Text>
        </Pressable>
      </ScrollView>

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

export default EditList;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
    paddingBottom: 50
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
});
