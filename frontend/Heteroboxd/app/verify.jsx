import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'

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
    <>
    <Head>
      <title>Verify</title>
      <meta name="description" content="Verify your e-mail address to start using Heteroboxd." />
      <meta property="og:title" content="Verify" />
      <meta property="og:description" content="Verify your e-mail address to start using Heteroboxd." />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{alignContent: 'center', justifyContent: 'center', flex: 1, paddingBottom: 50, backgroundColor: Colors.background, paddingHorizontal: 5}}>
      {server.result <= 0 ? (
        <ActivityIndicator size={'large'} color={Colors.text_link} />
      ) : (
        <HText style={[styles.title, {fontSize: 20}]}>{server.message}</HText>
      )}
      <Pressable
        style={[styles.button, server.result <= 0 && { opacity: 0.5 }]}
        onPress={() => server.result === 200 ? router.replace('/login') : router.replace('/contact')}
        disabled={server.result <= 0}
      >
        <HText style={styles.buttonText}>Proceed</HText>
      </Pressable>
    </View>
    </>
  )
}

export default Verify

const styles = StyleSheet.create({
  title: {
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