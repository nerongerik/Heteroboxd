import { useCallback, useState } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'
import LoadingResponse from '../components/loadingResponse'
import Password from '../components/password'
import Popup from '../components/popup'

const PasswordReset = () => {
  const { userId, token } = useLocalSearchParams()
  const rawToken = Array.isArray(token) ? token[0] : token
  const decodedToken = decodeURIComponent(rawToken)
  const [ password, setPassword ] = useState('')
  const [ pwValid, setPwValid ] = useState(false)
  const [ showError, setShowError ] = useState(false)
  const [ showRequirements, setShowRequirements ] = useState(false)
  const [ showPassword, setShowPassword ] = useState(false)
  const { width } = useWindowDimensions()
  const router = useRouter()
  const [ server, setServer ] = useState(Response.initial)

  const handleReset = useCallback(async () => {
    if (!pwValid) {
      setShowPassword(true)
      setShowError(true)
      setShowRequirements(true)
      return
    }
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: userId,
          Token: decodedToken,
          NewPassword: password
        })
      })
      if (res.ok) {
        setServer(Response.ok)
        router.replace('/login')
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId, decodedToken, password])

  return (
    <>
    <Head>
      <title>Reset Password</title>
      <meta name="description" content="Reset the password for your Heteroboxd account." />
      <meta property="og:title" content="Reset Password" />
      <meta property="og:description" content="Reset the password for your Heteroboxd account." />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, justifyContent: 'center', paddingBottom: 50}}>
      <View style={{width: Math.min(width*0.95, 1000), alignSelf: 'center'}}>
        <HText style={{color: Colors.text_title, fontSize: 20, textAlign: 'center', padding: 10, marginBottom: 10}}>Almost there! Enter your new password:</HText>
        {(showError && !pwValid) && <HText style={{fontSize: 12, color: Colors.password_meager, paddingLeft: 5}}>This password doesn't meet all the requirements.</HText>}
        <Password value={password} onChangeText={setPassword} onValidityChange={setPwValid} showPassword={showPassword} setShowPassword={setShowPassword} showRequirements={showRequirements} setShowRequirements={setShowRequirements}/>
        <Pressable
          disabled={password === ''}
          onPress={handleReset}
          style={[{backgroundColor: Colors.heteroboxd, alignSelf: 'center', borderRadius: 3}, (password === '') && {opacity: 0.5}]}
        >
          <HText style={{color: Colors.text_button, paddingHorizontal: 10, paddingVertical: 5, fontSize: 16}}>Confirm</HText>
        </Pressable>
      </View>

      <Popup
        visible={![-1, 0, 200].includes(server.result)}
        message={server.message}
        onClose={() => router.replace('/contact')}
      />
      <LoadingResponse visible={server.result === 0} />
    </View>
    </>
  )
}

export default PasswordReset