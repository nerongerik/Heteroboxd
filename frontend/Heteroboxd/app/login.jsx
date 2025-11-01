import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useState } from "react";
import { Link, useRouter } from "expo-router";
import Popup from '../components/popup';
import LoadingResponse from '../components/loadingResponse';
import { Colors } from "../constants/colors";
import { BaseUrl } from "../constants/api";
import { useAuth } from "../hooks/useAuth";

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState(-1);
  const [popupVisible, setPopupVisible] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const {login} = useAuth();
  
  const handleLoginPress = async () => {
    setResponse(0);
    await fetch(`${BaseUrl.api}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Email: email,
        Password: password,
        Device: Platform.OS
      })
    }).then(async (res) => {
      if (res.status === 200) {
        const data = await res.json();
        await login(data.jwt, data.refresh);
        setResponse(200);
        router.replace('/');
      } else if (res.status === 401) {
        setResponse(401);
        setMessage("The email or password you entered is incorrect.");
        setPopupVisible(true);
      } else {
        setResponse(500);
        setMessage("Something went wrong! Try again later, or contact Heteroboxd support for more information!");
        setPopupVisible(true);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor={Colors.text}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={Colors.text}
      />

      <TouchableOpacity
        style={[
                styles.button,
                (email.length === 0 || password.length === 0) && { opacity: 0.5 }
              ]}
        onPress={handleLoginPress}
        disabled={email.length === 0 || password.length === 0}>
          <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Don't have an account? <Link href='register' style={styles.link}>Sign up</Link>
      </Text>
      
      <Popup
        visible={popupVisible}
        message={message}
        onClose={() => {
          setPopupVisible(false);
          if (response === 500) router.replace('/contact');
          else router.replace('/login');
        }}
      />
      <LoadingResponse visible={response === 0} />
    </View>
  );
}

export default Login

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
    marginBottom: 40,
    color: Colors.text_title,
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
