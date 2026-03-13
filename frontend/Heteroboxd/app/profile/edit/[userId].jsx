import { useCallback, useEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import * as auth from '../../../helpers/auth'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { UserAvatar } from '../../../components/userAvatar'

const ProfileEdit = () => {
  const { userId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState(null)
  const [ name, setName ] = useState('')
  const [ bio, setBio ] = useState('')
  const [ profileChanged, setProfileChanged ] = useState(false)
  const [ profileUri, setProfileUri ] = useState('')
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()

  const loadData = useCallback(async () => {
    if (user?.userId !== userId) {
      setServer(Response.forbidden)
      setData({})
      return
    }
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/users?UserId=${userId}`)
      if (res.ok) {
        const json = await res.json()
        setData({ name: json.name, pictureUrl: json.pictureUrl, bio: json.bio })
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
        setData({})
      } else {
        setServer(Response.internalServerError)
        setData({})
      }
    } catch {
      setServer(Response.networkError)
      setData({})
    }
  }, [user, userId])

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Permission to access media library is required to change profile picture.')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsEditing: true,
        aspect: [1, 1],
      })
      setServer(Response.loading)
      if (!result.canceled) {
        const uri = result.assets?.[0]?.uri ?? result.uri
        if (uri) {
          const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 150, height: 150 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.PNG }
          )
          setProfileChanged(true)
          setProfileUri(manipResult.uri)
        }
      }
      setServer(Response.ok)
    } catch {
      console.log('image pick failed; debugging...')
    }
  }

  const handleEdit = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: userId,
          Name: name,
          GeneratePresign: profileChanged,
          Bio: bio
        })
      })
      if (res.ok) {
        const json = await res.json()
        if (json.presignedUrl && profileChanged) {
          const response = await fetch(profileUri)
          const blob = await response.blob()
          const picRes = await fetch(json.presignedUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' }
          })
          if (picRes.ok) {
            setServer(Response.ok)
            router.replace(`/profile/${userId}`)
          } else {
            setServer(Response.internalServerError)
          }
        } else {
          setServer(Response.ok)
          router.replace(`/profile/${userId}`)
        }
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, userId, name, profileChanged, profileUri, bio, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!data) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{flex: 1, backgroundColor: Colors.background}} behavior="padding" enabled>
      <ScrollView contentContainerStyle={{flexGrow: 1, alignItems: 'center', padding: 20, paddingBottom: 50}}>
        <View style={[styles.form, {maxWidth: width > 1000 ? 1000 : '100%' }]}>
          <HText style={styles.title}>Edit Your Profile</HText>
          <Pressable onPress={pickImage} style={styles.profileWrapper}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.profileImage} />
            ) : (
              <Pressable onPress={pickImage}>
                <UserAvatar pictureUrl={data.pictureUrl} style={styles.profileImage} />
              </Pressable>
            )}
            <HText style={styles.changePicText}>Change Profile Picture</HText>
          </Pressable>

          <HText style={[styles.changePicText, {padding: 5, marginTop: -5}]}>Change Name</HText>
          <TextInput
            style={styles.input}
            placeholder={data.name}
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.text_placeholder}
          />

          <HText style={[styles.changePicText, {padding: 5}]}>Change Bio</HText>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder={data.bio}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.text_placeholder}
          />

          <Pressable
            style={[styles.button, (!name && !bio && !profileUri) && { opacity: 0.5 }]}
            onPress={handleEdit}
            disabled={!name && !bio && !profileUri}
          >
            <HText style={styles.buttonText}>Confirm</HText>
          </Pressable>

          <HText style={styles.footerText}>Changed your mind? <Link href={`profile/${userId}`} style={styles.link}>Cancel</Link></HText>
        </View>

        <LoadingResponse visible={server.result <= 0} />
        <Popup
          visible={[403, 404, 500].includes(server.result)}
          message={server.message}
          onClose={() => server.response === 403 ? router.replace('/login') : server.result === 404 ? router.back() : router.replace('/contact')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default ProfileEdit

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
  button: { backgroundColor: Colors.heteroboxd, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '25%', alignSelf: 'center' },
  buttonText: { color: Colors.text_button, fontWeight: '600' },
  footerText: { textAlign: 'center', marginTop: 20, fontSize: 14, color: Colors.text },
  link: { color: Colors.text_link, fontWeight: '600' },
})