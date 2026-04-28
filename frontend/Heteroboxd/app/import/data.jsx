import { View, ScrollView, useWindowDimensions, Platform, Pressable } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import Head from 'expo-router/head'
import HText from '../../components/htext'
import { Colors } from '../../constants/colors'
import { useAuth } from '../../hooks/useAuth'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Response } from '../../constants/response'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { BaseUrl } from '../../constants/api'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'

const Import = () => {
  const { user, isValidSession } = useAuth()
  const { width } = useWindowDimensions()
  const [ file, setFile ] = useState(null)
  const inputRef = useRef(null)
  const [ server, setServer ] = useState(Response.initial)
  const uploadRef = useRef(false)
  const router = useRouter()

  const handleUpload = useCallback(async () => {
    if (uploadRef.current) return
    uploadRef.current = true
    try {
      if (!user || !(await isValidSession())) {
        setServer(Response.forbidden)
        return
      }
      setServer(Response.loading)
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/imports/sign?FileName=${encodeURIComponent(file.name || '')}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        const res2 = await fetch(json.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': 'application/zip', 'Cache-Control': 'no-cache' }
        })
        if (res2.ok) {
          const res3 = await fetch(`${BaseUrl.api}/imports/enqueue?Key=${encodeURIComponent(json.key)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${jwt}` }
          })
          if (res3.ok) {
            setServer(Response.ok)
            router.replace('import/status')
          } else if (res3.status === 400) {
            setServer({ result: 400, message: `You already uploaded a file on: ${format.parseDate(await res3.text())}. If there was an error with your original import, you can try again when the old files are cleared from queue (~24 hours), or contact Heteroboxd support for more information.` })
          } else {
            setServer(Response.internalServerError)
          }
        } else {
          setServer({ result: 500, message: 'File upload failed! Please make sure you chose the exact unchanged file you downloaded from Letterboxd and try again.' })
        }
      } else if (res.status === 400) {
        setServer({ result: 400, message: `You already uploaded a file on: ${format.parseDate(await res.text())}. If there was an error with your original import, you can try again when the old files are cleared from queue (~24 hours), or contact Heteroboxd support for more information.` })
      } else if (res.status === 404) {
        setServer({ result: 404, message: 'It looks like the file you uploaded is not a .zip archive! Please make sure you chose the exact unchanged file you downloaded from Letterboxd and try again.' })
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    } finally {
      uploadRef.current = false
    }
  }, [user, file])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected && selected.name.endsWith('.zip')) {
      setFile(selected)
    } else {
      alert('Only .zip files allowed!')
    }
  }

  const widescreen = useMemo(() => width > 1000, [width])

  if (!user) {
    return (
      <>
      <Head>
        <title>Import your Data from Letterboxd</title>
        <meta name="description" content="Continue where you left off! Heteroboxd lets you import all your Letterboxd reviews, lists, watched films, watchlist, and profile data." />
        <meta property="og:title" content="Import your Data from Letterboxd" />
        <meta property="og:description" content="Continue where you left off! Heteroboxd lets you import all your Letterboxd reviews, lists, watched films, watchlist, and profile data." />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
      </Head>
      <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background}}>
        <ScrollView contentContainerStyle={{width: Math.min(width*0.9, 1000), flexGrow: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center'}} showsVerticalScrollIndicator={false}>
          <HText style={{fontSize: 32, fontWeight: '700'}}>
            <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
          </HText>
          
          {/*TUTORIAL VIDEO*/}

          <Link href='/login' style={{marginVertical: 200, textAlign: 'center', color: Colors.text, fontWeight: 'bold', fontSize: widescreen ? 24 : 18}}><HText style={{color: Colors.heteroboxd}}>SIGN IN</HText> or <HText style={{color: Colors._heteroboxd}}>JOIN</HText> Heteroboxd for <HText style={{color: Colors.text_title}}>FREE</HText> to import all your data from Letterboxd and access other members-only features!</Link>
          <HText style={{color: Colors.text, fontSize: 18, fontWeight: '400', textAlign: 'center', lineHeight: 24}}>
            the <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}>L</HText> in Letterboxd stands for 
            <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}> Loser</HText>
            {'\n'}
            the <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}>H</HText> in Heteroboxd stands for 
            <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}> Winner</HText>
            {'\n'}
            <HText style={{ color: Colors.text_title, fontSize: 20, fontWeight: '700' }}>
              choose wisely.
            </HText>
          </HText>
        </ScrollView>
      </View>
      </>
    )
  }

  return (
    <>
    <Head>
      <title>Import your Data from Letterboxd</title>
      <meta name="description" content="Continue where you left off! Heteroboxd lets you import all your Letterboxd reviews, lists, watched films, watchlist, and profile data." />
      <meta property="og:title" content="Import your Data from Letterboxd" />
      <meta property="og:description" content="Continue where you left off! Heteroboxd lets you import all your Letterboxd reviews, lists, watched films, watchlist, and profile data." />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background}}>
      <ScrollView contentContainerStyle={{width: Math.min(width*0.9, 1000), flexGrow: 1, justifyContent: 'center', alignSelf: 'center'}} showsVerticalScrollIndicator={false}>
        <HText style={{fontSize: 32, fontWeight: '700', textAlign: 'center'}}>
          <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
        </HText>

        {/*TUTORIAL VIDEO*/}
        <View style={{height: 100}} />
        <HText style={{color: Colors.text, fontSize: 18}}>
          {'  • '}First, head over to <Link style={{color: Colors.heteroboxd, textDecorationLine: 'underline', textDecorationColor: Colors.heteroboxd}} href='https://letterboxd.com/settings/data/' target='_blank'>your Letterboxd account settings</Link> and click <HText style={{color: Colors.text_title}}>EXPORT YOUR DATA</HText>
        </HText>
        <Image style={{alignSelf: 'center', marginVertical: 20, width: 400, height: 156, resizeMode: 'contain'}} source={require('../../assets/step_1.png')} />
        <HText style={{color: Colors.text, fontSize: 18}}>
          {'  • '}In the pop-up dialogue, simply confirm your request.
        </HText>
        <Image style={{alignSelf: 'center', marginVertical: 20, width: 400, height: 145, resizeMode: 'contain'}} source={require('../../assets/step_2.png')} />
        <HText style={{color: Colors.text, fontSize: 18}}>
          {'  • '}Download the file. You can leave the default name or change it, but it <HText style={{color: Colors.text_title}}>must</HText> stay a <HText style={{color: Colors.text_title}}>.zip</HText> archive.
        </HText>
        <Image style={{alignSelf: 'center', marginVertical: 20, width: 400, height: 245, resizeMode: 'contain'}} source={require('../../assets/step_3.png')} />
        <HText style={{color: Colors.text, fontSize: 18}}>
          {'  • '}Upload your data to Heteroboxd!
        </HText>
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <Pressable onPress={() => inputRef.current?.click()} style={{width: 400, height: 200, borderWidth: 2, borderStyle: 'dashed', borderRadius: 5, borderColor: file ? Colors._heteroboxd : Colors.heteroboxd, justifyContent: 'center', alignItems: 'center', cursor: 'pointer'}}>
            <HText style={{color: file ? Colors._heteroboxd : Colors.heteroboxd, textAlign: 'center', paddingHorizontal: 20}}>
              {file ? file.name : 'Choose a file to upload from your device'}
            </HText>
          </Pressable>
          <input ref={inputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />
        </View>
        <Pressable onPress={handleUpload} disabled={!file} style={[{width: 150, alignSelf: 'center', padding: 15, backgroundColor: Colors.heteroboxd, borderRadius: 5}, !file && {opacity: 0.5}]}>
          <HText style={{fontSize: 18, fontWeight: 'bold', color: Colors.text_button, textAlign: 'center'}}>IMPORT</HText>
        </Pressable>

        <View style={{height: 100}} />
        <HText style={{color: Colors.text, fontSize: 18, fontWeight: '400', textAlign: 'center', lineHeight: 24}}>
          the <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}>L</HText> in Letterboxd stands for 
          <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}> Loser</HText>
          {'\n'}
          the <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}>H</HText> in Heteroboxd stands for 
          <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}> Winner</HText>
          {'\n'}
          <HText style={{ color: Colors.text_title, fontSize: 20, fontWeight: '700' }}>
            choose wisely.
          </HText>
        </HText>
      </ScrollView>
      <LoadingResponse visible={server.result === 0} />
      <Popup
        visible={[400, 403, 404, 500].includes(server.result)}
        message={server.message}
        onClose={() => { [400, 404, 500].includes(server.result) ? router.replace('/contact') : router.replace('/login') }}
      />
    </View>
    </>
  )
}

export default Import