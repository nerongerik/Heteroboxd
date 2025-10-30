import { StyleSheet, TextInput, View, Text, TouchableOpacity, Image, Alert } from 'react-native'
import { useState } from 'react'
import { Link } from 'expo-router'
import { HTTP } from '../constants/HTTP'
import { Colors } from '../constants/Colors'
import Password from '../components/password'
import Popup from '../components/popup'
import * as ImagePicker from 'expo-image-picker'
 
const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwValid, setPwValid] = useState(false);
  const [repeatPassword, setRepeatPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileUri, setProfileUri] = useState("");
  const [response, setResponse] = useState(0);
  const [message, setMessage] = useState("");
  const [popupVisible, setPopupVisible] = useState(false)

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

  async function handleRegister() {
    fetch(`${HTTP.api}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Name: name,
        Email: email,
        Password: password,
        PictureUrl: "", //we are yet to setup image storage
        Bio: bio
      })
    }).then((res) => {
      console.log(res);
      if (res.status === 200) {
        setMessage("You have successfully joined the Heteroboxd community. Please check your email to verify your account within 24 hours.");
        setResponse(200);
      } else if (res.status === 400) {
        setMessage(`The email address ${email} is already in use. Did you mean to log in instead?`);
        setResponse(400);
      } else {
        setMessage("Something went wrong! Try again later, or contact Heteroboxd support for further inquires.");
        setResponse(500);
      }
      setPopupVisible(true);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Us</Text>

      <TouchableOpacity onPress={pickImage} style={styles.profileWrapper}>
        <Image
          source={{ uri: profileUri }}
          style={styles.profileImage}
        />
        <Text style={styles.changePicText}>Profile Picture (optional)</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name*"
        value={name}
        onChangeText={setName}
        placeholderTextColor={Colors.text}
      />

      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Bio (optional)"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        placeholderTextColor={Colors.text}
      />

      <TextInput
        style={styles.input}
        placeholder="Email*"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor={Colors.text}
      />

      <Password value={password} onChangeText={setPassword} onValidityChange={setPwValid} />

      <TextInput
        style={styles.input}
        placeholder="Repeat Password*"
        secureTextEntry
        onChangeText={setRepeatPassword}
        autoCapitalize="none"
        placeholderTextColor={Colors.text}
      />

      <TouchableOpacity
        style={[
                styles.button,
                (email.length === 0 || !pwValid || name.trim().length === 0 || password !== repeatPassword) && { opacity: 0.5 }
              ]}
        onPress={handleRegister}
        disabled={email.length === 0 || !pwValid || name.trim().length === 0 || password !== repeatPassword}
      >
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already a member? <Link href='login' style={styles.link}>Log in</Link>
      </Text>

      <Popup visible={popupVisible} message={message} onClose={() => setPopupVisible(false)} />
    </View>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: Colors.text_title,
  },

  // profile picture wrapper to show 'Change' affordance
  profileWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  },
  changePicText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.text_link,
    fontWeight: '600',
  },

  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    color: Colors.text_input,
  },

  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor: Colors.button,
    width: "75%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: "600",
  },
  footerText: {
    fontWeight: "500",
    marginTop: 20,
    fontSize: 14,
    color: Colors.text,
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  },
});