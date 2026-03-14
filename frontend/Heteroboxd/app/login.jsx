import { useCallback, useState } from 'react'
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'
import LoadingResponse from '../components/loadingResponse'
import Popup from '../components/popup'

const Login = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ server, setServer ] = useState(Response.initial)
  const [ showPassword, setShowPassword ] = useState(false)
  const { width } = useWindowDimensions()
  const router = useRouter()
  const { login } = useAuth()
  const [ recovery, setRecovery ] = useState('')
  const [ visible, setVisible ]= useState(false)

  const handleLogin = useCallback(async () => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: email,
          Password: password
        })
      })
      if (res.ok) {
        const json = await res.json()
        await login(json.jwt, json.refresh)
        setServer(Response.ok)
        router.replace('/')
      } else if (res.status === 401) {
        setServer({ result: 403, message: 'Incorrect credentials! Please make sure you entered the correct email and password.' })
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [email, password])

  const sendRecovery = useCallback(async () => {
    setVisible(false)
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/auth/forgot-password?Email=${recovery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [recovery])

  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: Colors.background}} behavior='padding' enabled>
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20}} keyboardShouldPersistTaps='handled'>
        <View style={[styles.form, {width: width > 1000 ? 1000 : width*0.95}]}>
          <HText style={styles.title}>Welcome Back</HText>
          <TextInput
            style={[styles.input, {fontFamily: 'Inter_400Regular'}]}
            placeholder='Email'
            keyboardType='email-address'
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            placeholderTextColor={Colors.text_placeholder}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.inputInner, {fontFamily: 'Inter_400Regular'}]}
              placeholder='Password'
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={Colors.text_placeholder}
              onSubmitEditing={() => {
                if (email.length > 0 && password.length > 0) {
                  handleLogin()
                }
              }}
              returnKeyType='join'
            />
            <Pressable onPress={() => setShowPassword(prev => !prev)} style={styles.iconBtn}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color={Colors.text_input} />
            </Pressable>
          </View>
          <Pressable
            style={[styles.button, (email.length === 0 || password.length === 0) && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={email.length === 0 || password.length === 0}>
            <HText style={styles.buttonText}>Log In</HText>
          </Pressable>
          <Pressable onPress={() => setVisible(true)} style={{marginTop: 10}}>
            <HText style={[styles.footerText, {color: Colors.text_link}]}>Forgot your password?</HText>
          </Pressable>
          <HText style={[styles.footerText, {marginTop: 50}]}>
            Don't have an account? <Link href='register' style={styles.link}>Sign up</Link>
          </HText>
        </View>
        <Modal
          transparent={true}
          visible={visible}
          animationType='fade'
        >
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
            <View style={{backgroundColor: Colors.card, padding: 15, borderRadius: 10, alignItems: 'center'}}>
              <HText style={{fontSize: 20, fontWeight: '600', paddingVertical: 7, color: Colors.text_title, textAlign: 'center'}}>Enter your account email:</HText>
              <TextInput
                placeholder='nerongerik@gmail.com'
                value={recovery}
                onChangeText={setRecovery}
                placeholderTextColor={Colors.text_placeholder}
                style={{
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                  borderRadius: 3,
                  padding: 7,
                  paddingHorizontal: 10,
                  overflow: 'hidden',
                  outlineStyle: 'none',
                  outlineWidth: 0,
                  outlineColor: 'transparent',
                  color: Colors.text_input,
                  fontSize: 16,
                  width: width >= 1000 ? width/4 : width/2,
                  marginBottom: 20
                }}
                onSubmitEditing={() => {
                  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recovery)) {
                    sendRecovery()
                  }
                }}
                returnKeyType='send'
              />
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                <Pressable onPress={() => {setRecovery(''); setVisible(false)}} style={[styles.buttonR, { backgroundColor: Colors.heteroboxd, marginHorizontal: 10 }]}>
                  <HText style={styles.buttonTextR}>Cancel</HText>
                </Pressable>
                <Pressable
                  disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recovery)}
                  onPress={sendRecovery}
                  style={[
                    styles.buttonR,
                    { backgroundColor: Colors._heteroboxd, marginHorizontal: 10 },
                    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recovery)) && {opacity: 0.5}
                  ]}
                >
                  <HText style={styles.buttonTextR}>Send</HText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Popup
          visible={[403, 500].includes(server.result)}
          message={server.message}
          onClose={() => { server.response === 403 ? setServer(Response.initial) : router.replace('/contact') }}
        />
        <LoadingResponse visible={server.response <= 0} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default Login

const styles = StyleSheet.create({
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
    backgroundColor: Colors.heteroboxd,
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
    fontSize: 14,
    color: Colors.text,
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  },
  buttonR: {
    backgroundColor: Colors.heteroboxd,
    paddingVertical: 7,
    borderRadius: 3,
    width: 75,
    alignItems: 'center'
  },
  buttonTextR: {
    color: Colors.text_button,
    fontWeight: '600',
  }
})