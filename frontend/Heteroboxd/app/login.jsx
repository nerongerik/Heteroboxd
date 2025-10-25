import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Colors } from '../constants/Colors';
import { useState } from "react";
import { Link } from "expo-router";

const Login = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleLoginPress = () => {}; //todo

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
