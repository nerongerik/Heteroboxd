import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, useWindowDimensions } from "react-native";
import { useState } from "react";
import { Link, useRouter } from "expo-router";
import Popup from '../components/popup';
import LoadingResponse from '../components/loadingResponse';
import { Colors } from "../constants/colors";
import { BaseUrl } from "../constants/api";
import { useAuth } from "../hooks/useAuth";
import Feather from '@expo/vector-icons/Feather';
import { Platform } from "react-native";

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState(-1);
  const [popupVisible, setPopupVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { login } = useAuth();

  const handleLoginPress = async () => {
    setResponse(0);
    await fetch(`${BaseUrl.api}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Email: email,
        Password: password
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
        setMessage("Something went wrong! Try again later.");
        setPopupVisible(true);
      }
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.form, { maxWidth: Platform.OS === "web" && width > 1000 ? 1000 : "100%" }]}>

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

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputInner}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={Colors.text}
            />
            <TouchableOpacity onPress={() => setShowPassword(prev => !prev)} style={styles.iconBtn}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={22} color={Colors.text_input} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, (email.length === 0 || password.length === 0) && { opacity: 0.5 }]}
            onPress={handleLoginPress}
            disabled={email.length === 0 || password.length === 0}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Don't have an account? <Link href='register' style={styles.link}>Sign up</Link>
          </Text>
        </View>

        <Popup
          visible={popupVisible}
          message={message}
          onClose={() => {
            setPopupVisible(false);
            if (response === 500) router.replace('/contact');
          }}
        />

        <LoadingResponse visible={response === 0} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  form: {
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 40,
    color: Colors.text_title,
    textAlign: "center",
  },
  input: {
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
  inputContainer: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    alignItems: "center",
    marginBottom: 15,
  },
  inputInner: {
    flex: 1,
    color: Colors.text_input,

    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  iconBtn: {
    paddingLeft: 8,
    justifyContent: "center",
  },
  button: {
    backgroundColor: Colors.button,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    width: '50%',
    alignSelf: 'center',
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: "600",
  },
  footerText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
    color: Colors.text,
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  },
});
