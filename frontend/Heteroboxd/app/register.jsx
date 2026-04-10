import { useCallback, useState } from 'react'
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'
import LoadingResponse from '../components/loadingResponse'
import Password from '../components/password'
import Popup from '../components/popup'
import * as FileSystem from 'expo-file-system/legacy'

const Register = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ pwValid, setPwValid ] = useState(false)
  const [ repeatPassword, setRepeatPassword ] = useState('')
  const [ name, setName ] = useState('')
  const [ bio, setBio ] = useState('')
  const [ profileUri, setProfileUri ] = useState('')
  const [ gender, setGender ] = useState(-1)
  const [ server, setServer ] = useState(Response.initial)
  const { width } = useWindowDimensions()
  const router = useRouter()
  const [ border1, setBorder1 ] = useState(false)
  const [ border2, setBorder2 ] = useState(false)
  const [ border3, setBorder3 ] = useState(false)
  const [ border4, setBorder4 ] = useState(false)

  const handleRegister = useCallback(async () => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: name,
          Email: email,
          Password: password,
          PictureExtension: profileUri ? '.png' : null,
          Bio: bio,
          Gender: gender === 0 ? 'male' : 'female'
        })
      })
      if (res.ok) {
        const json = await res.json()
        if (json.presignedUrl && profileUri) {
          if (Platform.OS === 'web') {
            const blob = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest()
              xhr.onload = () => resolve(xhr.response)
              xhr.onerror = () => reject(new Error('failed to fetch local image'))
              xhr.responseType = 'blob'
              xhr.open('GET', profileUri, true)
              xhr.send(null)
            })
            const picRes = await fetch(json.presignedUrl, {
              method: 'PUT',
              body: blob,
              headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
            })
            if (picRes.ok) {
              setServer({ result: 200, message: 'You have successfully joined the Heteroboxd community! We sent you a verification email needed to proceed.' })
            } else {
              setServer({ result: 200, message: `You have successfully joined the Heteroboxd community, but there was a problem uploading your profile picture: ${picRes.status}\nYou can always update your profile picture at a later time and try again. We sent you a verification email needed to proceed.` })
            }
          } else {
            const picRes = await FileSystem.uploadAsync(json.presignedUrl, profileUri, {
              httpMethod: 'PUT',
              uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
              headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
            })
            if (picRes.status >= 200 && picRes.status < 300) {
              setServer({ result: 200, message: 'You have successfully joined the Heteroboxd community! We sent you a verification email needed to proceed.' })
            } else {
              setServer({ result: 200, message: `You have successfully joined the Heteroboxd community, but there was a problem uploading your profile picture: ${picRes.status}\nYou can always update your profile picture at a later time and try again. We sent you a verification email needed to proceed.` })
            }
          }
        } else {
          setServer({ result: 200, message: 'You have successfully joined the Heteroboxd community! We sent you a verification email needed to proceed.' })
        }
      } else if (res.status === 400) {
        setServer({ result: 400, message: 'Registration error! This email is already in use.' })
      } else {
        setServer(Response.internalServerError)
      }
    } catch (e) {
      setServer({ result: 500, message: e?.message || 'blob parsing error.' })
    }
  }, [name, email, password, profileUri, bio, gender])

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required to change profile picture.')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1]
      })
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri ?? result.uri
        if (uri) {
          const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 150, height: 150 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.PNG }
          )
          setProfileUri(manipResult.uri)
        }
      }
    } catch {
      console.log('image pick failed; debugging...')
    }
  }

  return (
    <>
    <Head>
      <title>Register</title>
      <meta name="description" content="Create a new Heteroboxd account!" />
      <meta property="og:title" content="Register" />
      <meta property="og:description" content="Create a new Heteroboxd account!" />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: Colors.background}} behavior='padding' enabled>
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20}} keyboardShouldPersistTaps='handled'>
        <View style={[styles.form, { width: width > 1000 ? 1000 : width*0.95 }]}>
          <HText style={styles.title}>Join Us</HText>
          <Pressable onPress={pickImage} style={styles.profileWrapper}>
            <Image
              source={profileUri ? { uri: profileUri } : require('../assets/before-pick.png')}
              style={styles.profileImage}
            />
            <HText style={[styles.changePicText, {fontSize: width > 1000 ? 16 : 14}]}>Profile Picture (optional)</HText>
          </Pressable>
          <TextInput
            style={[styles.input, {borderColor: border1 ? Colors.heteroboxd : Colors.border_color, fontSize: width > 1000 ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
            placeholder='Name*'
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.text_placeholder}
            onFocus={() => setBorder1(true)}
            onBlur={() => setBorder1(false)}
          />
          <TextInput
            style={[styles.input, styles.bioInput, {borderColor: border2 ? Colors.heteroboxd : Colors.border_color, fontSize: width > 1000 ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
            placeholder='Bio (optional)'
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text_placeholder}
            onFocus={() => setBorder2(true)}
            onBlur={() => setBorder2(false)}
          />
          <TextInput
            style={[styles.input, {borderColor: border3 ? Colors.heteroboxd : Colors.border_color, fontSize: width > 1000 ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
            placeholder='Email*'
            keyboardType='email-address'
            value={email}
            onChangeText={setEmail}
            autoCapitalize='none'
            placeholderTextColor={Colors.text_placeholder}
            onFocus={() => setBorder3(true)}
            onBlur={() => setBorder3(false)}
          />
          <Password value={password} onChangeText={setPassword} onValidityChange={setPwValid} />
          <TextInput
            style={[styles.input, {borderColor: border4 ? Colors.heteroboxd : Colors.border_color, fontSize: width > 1000 ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
            placeholder='Repeat Password*'
            secureTextEntry
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            autoCapitalize='none'
            placeholderTextColor={Colors.text_placeholder}
            onFocus={() => setBorder4(true)}
            onBlur={() => setBorder4(false)}
            onSubmitEditing={() => {
              if (email.length > 0 && pwValid && name.trim().length > 0 && password === repeatPassword && gender !== -1) {
                handleRegister()
              }
            }}
            returnKeyType='join'
          />
          <View style={styles.genderContainer}>
            <Pressable
              style={styles.genderOption}
              onPress={() => setGender(0)}
            >
              <View style={[styles.radioCircle, gender === 0 && styles.radioSelected]} />
              <HText style={styles.genderText}>Male</HText>
            </Pressable>
            <Pressable
              style={styles.genderOption}
              onPress={() => setGender(1)}
            >
              <View style={[styles.radioCircle, gender === 1 && styles.radioSelected]} />
              <HText style={styles.genderText}>Female</HText>
            </Pressable>
          </View>
          <Pressable
            style={[styles.button, (email.length === 0 || !pwValid || name.trim().length === 0 || password !== repeatPassword || gender === -1) && { opacity: 0.5 }]}
            onPress={handleRegister}
            disabled={email.length === 0 || !pwValid || name.trim().length === 0 || password !== repeatPassword || gender === -1}
          >
            <HText style={styles.buttonText}>Register</HText>
          </Pressable>

          <HText style={styles.footerText}>
            Already a member? <Link href='login' style={styles.link}>Log in</Link>
          </HText>
        </View>

        <LoadingResponse visible={server.result === 0} />
        <Popup
          visible={[200, 400, 500].includes(server.result)}
          message={server.message}
          onClose={() => server.result === 200 ? router.replace('/login') : server.result === 400 ? setServer(Response.initial) : router.replace('/contact')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  )
}

export default Register

const styles = StyleSheet.create({
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
  button: { backgroundColor: Colors.heteroboxd, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10,
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
    backgroundColor: Colors.heteroboxd,
  },
  genderText: {
    color: Colors.text_input,
    fontSize: 14,
  }
})