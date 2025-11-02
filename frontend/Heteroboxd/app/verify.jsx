import { TouchableOpacity, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react';
import { Colors } from '../constants/colors';
import { BaseUrl } from '../constants/api';

const Verify = () => {
  
  const {userId, token} = useLocalSearchParams();
  const [response, setResponse] = useState(-1);
  const [message, setMessage] = useState("");
  const router = useRouter();
  useEffect(() => {
    verifyUser();
  }, [])

  async function verifyUser() {
    setResponse(0);
    fetch(`${BaseUrl.api}/users/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        UserId: userId,
        Token: token
      })
    }).then((res) => {
      console.log(res);
      if (res.status === 200) {
        setMessage("Thank you for verifying your email address! You are now free to use Heteroboxd.");
        setResponse(200);
      } else if (res.status === 404) {
        setMessage("The account you are trying to verify no longer exists. Please contact Heteroboxd support for help!");
        setResponse(404);
      } else {
        setMessage("Something went wrong! Try again later, or contact Heteroboxd support for further inquires.");
        setResponse(500);
      }
    });
  }

  function handleProceedPress() {
    if (response === 200) router.replace('/login');
    else router.replace('/contact');
  }

  return (
    <View style={styles.container}>
      {response === 0 ? (
        <ActivityIndicator size={'large'} color={Colors.text_link} />
      ) : (
        <Text style={styles.title}>{message}</Text>
      )}
      <TouchableOpacity
        style={[
                styles.button,
                (response === -1 || response === 0) && { opacity: 0.5 }
              ]}
        onPress={handleProceedPress}
        disabled={response === -1 || response === 0}
      >
        <Text style={styles.buttonText}>Proceed</Text>
      </TouchableOpacity>
    </View>
  )
}

export default Verify

const styles = StyleSheet.create({
  container: {
    alignContent: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: "5%",
    paddingBottom: 50,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
    color: Colors.text_title,
    textAlign: "center"
  },
  button: {
    backgroundColor: Colors.button,
    width: "50%",
    padding: 15,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 10,
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: "600",
    alignSelf: 'center',
  },
});