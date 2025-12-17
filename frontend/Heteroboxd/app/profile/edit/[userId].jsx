import { StyleSheet, Text, Image, TextInput, View, KeyboardAvoidingView, ScrollView, Platform, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useRouter, useLocalSearchParams, Link } from 'expo-router'
import { Colors } from '../../../constants/colors'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { useState, useEffect } from 'react'
import { UserAvatar } from '../../../components/userAvatar'
import { useAuth } from '../../../hooks/useAuth'
import * as auth from '../../../helpers/auth'
import { BaseUrl } from '../../../constants/api'
import * as ImagePicker from 'expo-image-picker';

const ProfileEdit = () => {

  const { userId } = useLocalSearchParams(); //needed for fetching
  const { user, isValidSession } = useAuth(); //needed for jwt

  const { width } = useWindowDimensions();

  const [data, setData] = useState(null); //user's initial data

  //new data -> not all can be null at once for request to pass
  const [name, setName] = useState(null);
  const [bio, setBio] = useState(null);
  const [profileUri, setProfileUri] = useState(null);

  const [response, setResponse] = useState(-1); //for loading and popups
  const [message, setMessage] = useState(''); //error message

  const router = useRouter(); //redirect after button press

  useEffect(() => { //profile fetch
    (async () => {
      if (!user || user.userId !== userId) { //illegal case
        setMessage("How did you get in here? Your session is invalid. Return from whence thou cam'st!");
        setResponse(401);
        setData({});
        return;
      }
      //otherwise...
      const res = await fetch(`${BaseUrl.api}/users/${userId}`, {method: "GET",});
      if (res.status === 200) {
        const json = await res.json();
        setResponse(200);
        setData({ name: json.name, pictureUrl: json.pictureUrl, bio: json.bio });
      } else if (res.status === 404) {
        setMessage("The user you are trying to find no longer exists.");
        setResponse(404);
        setData({})
      } else {
        setMessage("Something went wrong. Contact Heteroboxd support for more information.");
        setResponse(500);
        setData({})
      }
    })();
  }, [userId]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required to change profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1,1],
      });
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri ?? result.uri;
        if (uri) setProfileUri(uri);
      }
    } catch (e) {
      console.warn('Image pick error', e);
    }
  }

  const handleEdit = async () => {
    const vS = await isValidSession();
    if (!vS) {
      setMessage("We failed to validate your session, and thus cannot procede in committing your changes.");
      setResponse(401);
      return;
    }
    setResponse(0);
    const jwt = await auth.getJwt();
    const res = await fetch(`${BaseUrl.api}/users`, {
      method: 'PUT',
      body: JSON.stringify({
        UserId: userId,
        Name: name,
        PictureUrl: profileUri,
        Bio: bio
      }),
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.status === 200) {
      setResponse(200);
      router.replace(`/profile/${userId}`);
    } else if (res.status === 404) {
      setMessage("The user you are trying to edit no longer exists.");
      setResponse(404);
    } else {
      setMessage("Something went wrong. Contact Heteroboxd support for more information.");
      setResponse(500);
    }
  }

  if (!data) {
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.form, { maxWidth: Platform.OS === 'web' && width > 1000 ? 1000 : '100%' }]}>

          <Text style={styles.title}>Edit Your Profile</Text>

          <TouchableOpacity onPress={pickImage} style={styles.profileWrapper}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.profileImage} />
            ) : (
              <TouchableOpacity onPress={pickImage}>
                <UserAvatar pictureUrl={data.pictureUrl} style={styles.profileImage} />
              </TouchableOpacity>
            )}
            <Text style={styles.changePicText}>Change Profile Picture</Text>
          </TouchableOpacity>

          <Text style={[styles.changePicText, {padding: 5, marginTop: -5}]}>Change Name</Text>
          <TextInput
            style={styles.input}
            placeholder={data.name}
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.text_placeholder}
          />

          <Text style={[styles.changePicText, {padding: 5}]}>Change Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder={data.bio}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text_placeholder}
          />

          <TouchableOpacity
            style={[styles.button, (!name && !bio && !profileUri) && { opacity: 0.5 }]}
            onPress={handleEdit}
            disabled={!name && !bio && !profileUri}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Changed your mind? <Link href={`profile/${userId}`} style={styles.link}>Cancel</Link>
          </Text>

        </View>

        <Popup
          visible={response === 401 || response === 404 || response === 500}
          message={message}
          onClose={() => {
            response === 500 ? router.replace('/contact') : router.replace('/');
          }}
        />
        <LoadingResponse visible={response === 0} />

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ProfileEdit

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, alignItems: 'center', padding: 20, paddingBottom: 50 },
  form: { width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 30, color: Colors.text_title, textAlign: 'center' },
  profileWrapper: { alignItems: 'center', marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderColor: Colors.border_color, borderWidth: 1.5 },
  changePicText: { marginTop: 6, fontSize: 12, color: Colors.text_link, fontWeight: '600' },
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
  button: { backgroundColor: Colors.button, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10,
            width: '25%', alignSelf: 'center' },
  buttonText: { color: Colors.text_button, fontWeight: '600' },
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: Colors.text },
  link: { color: Colors.text_link, fontWeight: '600' },
});