import { StyleSheet, TextInput, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, Image, Alert, View, Platform } from 'react-native';
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import Password from '../components/password';
import Popup from '../components/popup';
import * as ImagePicker from 'expo-image-picker';
import LoadingResponse from '../components/loadingResponse';
import { Colors } from '../constants/colors';
import { BaseUrl } from '../constants/api';
import { useWindowDimensions } from 'react-native';

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwValid, setPwValid] = useState(false);
  const [repeatPassword, setRepeatPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileUri, setProfileUri] = useState("");
  const [gender, setGender] = useState(-1); //0 - male, 1 - female
  const [response, setResponse] = useState(-1);
  const [message, setMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const { width } = useWindowDimensions();
  const router = useRouter();

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
        setProfilePicture(result.assets);
        const uri = result.assets?.[0]?.uri ?? result.uri;
        if (uri) setProfileUri(uri);
      }
    } catch (e) {
      console.warn('Image pick error', e);
    }
  }

  const getFileExtension = (uri) => {
    const filename = uri.split('/').pop().split('?')[0];
    const parts = filename.split('.');
    
    if (parts.length > 1) {
      return '.' + parts.pop().toLowerCase();
    }
    return '.jpg';
  }

  async function handleRegister() {
    setResponse(0);

    //filename extension extraction
    let fileExtension = null;
    if (profilePicture && profilePicture.length > 0) {
      const file = profilePicture[0];
      if (file.fileName) {
        fileExtension = getFileExtension(file.fileName);
      } else if (file.uri) {
        fileExtension = getFileExtension(file.uri);
      } else if (file.mimeType) {
        const mimeToExt = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp'
        };
        fileExtension = mimeToExt[file.mimeType] || '.jpg';
      }
    }

    try {
      const res = await fetch(`${BaseUrl.api}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Name: name,
          Email: email,
          Password: password,
          PictureExtension: fileExtension,
          Bio: bio,
          Gender: gender === 0 ? "male" : "female",
        }),
      });
      if (res.ok) {
        //upload to R2
        const json = await res.json()
        if (json.presignedUrl && profilePicture) {
          const file = profilePicture[0];
          const response = await fetch(file.uri);
          const blob = await response.blob();
          const picRes = await fetch(json.presignedUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': file.mimeType || 'image/jpeg' }
          })
          if (picRes.status === 200) {
            setMessage("You have successfully joined the Heteroboxd community! We sent you an e-mail verification message needed to proceed.");
            setResponse(200);
          } else {
            setMessage(`You have successfully joined the Heteroboxd community, but there was a problem uploading your profile picture: ${picRes.status}\nYou can always update your profile picture at a later time and try again. We sent you an e-mail verification message needed to proceed.`);
            setResponse(200);
          }
        } else {
          setMessage("You have successfully joined the Heteroboxd community! We sent you an e-mail verification message needed to proceed.");
          setResponse(200);
        }
      } else if (res.status === 400) {
        setMessage(`The email address ${email} is already in use.`);
        setResponse(400);
      } else {
        setMessage("Something went wrong! Try again later.");
        setResponse(500);
      }
    } catch (err) {
      setMessage("Unable to reach the server. Please try again later.");
      setResponse(500);
    }
    setPopupVisible(true);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.form, { maxWidth: Platform.OS === 'web' && width > 1000 ? 1000 : '100%' }]}>

          <Text style={styles.title}>Join Us</Text>

          <TouchableOpacity onPress={pickImage} style={styles.profileWrapper}>
            <Image
              source={profileUri ? { uri: profileUri } : require('../assets/before-pick.png')}
              style={styles.profileImage}
            />
            <Text style={styles.changePicText}>Profile Picture (optional)</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Name*"
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.text_placeholder}
          />

          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text_placeholder}
          />

          <TextInput
            style={styles.input}
            placeholder="Email*"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            placeholderTextColor={Colors.text_placeholder}
          />

          <Password value={password} onChangeText={setPassword} onValidityChange={setPwValid} />

          <TextInput
            style={styles.input}
            placeholder="Repeat Password*"
            secureTextEntry
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            autoCapitalize="none"
            placeholderTextColor={Colors.text_placeholder}
          />

          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => setGender(0)}
            >
              <View style={[styles.radioCircle, gender === 0 && styles.radioSelected]} />
              <Text style={styles.genderText}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.genderOption}
              onPress={() => setGender(1)}
            >
              <View style={[styles.radioCircle, gender === 1 && styles.radioSelected]} />
              <Text style={styles.genderText}>Female</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, (email.length === 0 || !pwValid || name.trim().length === 0 || password !== repeatPassword || gender === -1) && { opacity: 0.5 }]}
            onPress={handleRegister}
            disabled={email.length === 0 || !pwValid || name.trim().length === 0 || password !== repeatPassword || gender === -1}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Already a member? <Link href='login' style={styles.link}>Log in</Link>
          </Text>

        </View>

        <Popup
          visible={popupVisible}
          message={message}
          onClose={() => {
            setPopupVisible(false);
            router.replace('/');
          }}
        />
        <LoadingResponse visible={response === 0} />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default Register;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
            width: '50%', alignSelf: 'center' },
  buttonText: { color: Colors.text_button, fontWeight: '600' },
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: Colors.text },
  link: { color: Colors.text_link, fontWeight: '600' },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    alignSelf: 'center',
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border_color,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: Colors.border_color,
    backgroundColor: Colors.button,
  },
  genderText: {
    color: Colors.text_input,
    fontSize: 14,
  },
});
