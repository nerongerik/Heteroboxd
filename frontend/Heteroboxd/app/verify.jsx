import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'

const Verify = () => {
  const { userId, token } = useLocalSearchParams()
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()

  const verifyUser = useCallback(async () => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/users/verify?UserId=${userId}&Token=${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (res.ok) {
        setServer({ result: 200, message: 'Thank you for verifying your email address! You are now free to use Heteroboxd.' })
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId, token])

  useEffect(() => {
    verifyUser()
  }, [verifyUser])

  return (
    <View style={{alignContent: 'center', justifyContent: 'center', flex: 1, paddingBottom: 50, backgroundColor: Colors.background, paddingHorizontal: 5}}>
      {server.response <= 0 ? (
        <ActivityIndicator size={'large'} color={Colors.text_link} />
      ) : (
        <Text style={styles.title}>{server.message}</Text>
      )}
      <Pressable
        style={[styles.button, server.response <= 0 && { opacity: 0.5 }]}
        onPress={() => server.result === 200 ? router.replace('/login') : router.replace('/contact')}
        disabled={server.response <= 0}
      >
        <Text style={styles.buttonText}>Proceed</Text>
      </Pressable>
    </View>
  )
}

export default Verify

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
    color: Colors.text_title,
    textAlign: "center"
  },
  button: {
    backgroundColor: Colors.heteroboxd,
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
  }
})