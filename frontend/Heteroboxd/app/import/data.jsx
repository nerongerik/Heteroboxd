import { View, ScrollView, useWindowDimensions, Platform, Pressable, Linking } from 'react-native'
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
  const [ isDragging, setIsDragging ] = useState(false)
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
      const res = await fetch(`${BaseUrl.api}/imports/sign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        const res2 = await fetch(json.url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': 'application/zip' }
        })
        if (res2.ok) {
          const res3 = await fetch(`${BaseUrl.api}/imports/enqueue`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${jwt}` }
          })
          if (res3.ok) {
            setServer(Response.ok)
            Linking.openURL('https://www.heteroboxd.com/import/status')
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

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = () => {
    setIsDragging(false)
  }
  
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped && dropped.name.endsWith('.zip')) {
      setFile(dropped)
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
      <View style={{flex: 1, paddingBottom: 20, backgroundColor: Colors.background}}>
        <ScrollView contentContainerStyle={{width: Math.min(width*0.9, 1000), flexGrow: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center'}} showsVerticalScrollIndicator={false}>
          <HText style={{fontSize: widescreen ? 32 : 24, fontWeight: '700'}}>
            <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
          </HText>
          
          <View style={{width: widescreen ? 560 : 280, height: widescreen ? 315 : 157.5, marginVertical: widescreen ? 50 : 20, alignSelf: 'center'}}>
            <iframe
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/wE1lGWe9qGY?si=FrQe8C7xZQXxfVVJ" 
              title="WATCH THIS TUTORIAL VIDEO" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
            />
          </View>

          <Link href='/login' style={{marginVertical: widescreen ? 50 : 20, textAlign: 'center', color: Colors.text, fontWeight: 'bold', fontSize: widescreen ? 24 : 18}}><HText style={{color: Colors.heteroboxd}}>SIGN IN</HText> or <HText style={{color: Colors._heteroboxd}}>JOIN</HText> Heteroboxd for <HText style={{color: Colors.text_title}}>FREE</HText> to import all your data from Letterboxd and access other members-only features!</Link>
          
          <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: '400', textAlign: 'center', lineHeight: 24}}>
            the <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}>L</HText> in Letterboxd stands for 
            <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}> Loser</HText>
            {'\n'}
            the <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}>H</HText> in Heteroboxd stands for 
            <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}> Winner</HText>
            {'\n'}
            <HText style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16, fontWeight: '700' }}>
              choose wisely.
            </HText>
          </HText>
        </ScrollView>
      </View>
      </>
    )
  }

  if (user.lb) {
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
          <HText style={{fontSize: widescreen ? 32 : 24, fontWeight: '700'}}>
            <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
          </HText>

          <HText style={{marginTop: widescreen ? 200 : 100, marginBottom: 20, textAlign: 'center', color: Colors.text_title, fontWeight: '700', fontSize: widescreen ? 24 : 18}}>Congratulations for making the switch from Letterboxd to Heteroboxd - we knew you had it in you!</HText>
          <HText style={{marginBottom: widescreen ? 180 : 80, textAlign: 'center', color: Colors.text, fontWeight: '500', fontSize: widescreen ? 16 : 10}}>Was there a problem with your import? Feel free to <Link href='/contact' style={{color: Colors.heteroboxd}}>contact us</Link> regarding any issues, or to request another import attempt.</HText>
          
          
          <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: '400', textAlign: 'center', lineHeight: 24}}>
            the <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}>L</HText> in Letterboxd stands for 
            <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}> Loser</HText>
            {'\n'}
            the <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}>H</HText> in Heteroboxd stands for 
            <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}> Winner</HText>
            {'\n'}
            <HText style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16, fontWeight: '700' }}>
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
        <HText style={{fontSize: widescreen ? 32 : 24, fontWeight: '700', textAlign: 'center'}}>
          <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
        </HText>
        <HText style={{textAlign: 'center', fontSize: widescreen ? 18 : 14, marginTop: 15, color: Colors.text}}>This is a quick & easy guide to importing all your Letterboxd data - in one click. Once you've completed the steps bellow, it usually takes no more than an hour for your history to appear!</HText>

        <View style={{width: widescreen ? 560 : 280, height: widescreen ? 315 : 157.5, marginVertical: widescreen ? 50 : 20, alignSelf: 'center'}}>
          <iframe
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/wE1lGWe9qGY?si=FrQe8C7xZQXxfVVJ" 
            title="WATCH THIS TUTORIAL VIDEO" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
          />
        </View>

        <View style={{height: widescreen ? 20 : 5}} />
        <HText style={{color: Colors.text_title, fontSize: widescreen ? 18 : 14, lineHeight: 30}}>
          First, head over to <Link style={{color: Colors.heteroboxd, textDecorationLine: 'underline', textDecorationColor: Colors.heteroboxd}} href='https://letterboxd.com/settings/data/' target='_blank'>your Letterboxd account settings</Link> and click <span style={{whiteSpace: 'nowrap'}}><HText style={{backgroundColor: '#5a6675', padding: 7.5, fontWeight: 'bold', borderRadius: 5, color: Colors.text_title}}>EXPORT YOUR DATA</HText></span>
        </HText>
        <Image style={{alignSelf: 'center', marginVertical: 20, width: widescreen ? 400 : 300, height: widescreen ? 156 : 117, resizeMode: 'contain'}} source={require('../../assets/step_1.png')} />
        <HText style={{color: Colors.text_title, fontSize: widescreen ? 18 : 14, lineHeight: 30}}>
          In the pop-up dialogue, simply confirm your request by pressing <span style={{whiteSpace: 'nowrap'}}><HText style={{backgroundColor: '#58a93b', padding: 7.5, fontWeight: 'bold', borderRadius: 5, color: Colors.text_title}}>EXPORT DATA</HText></span>
        </HText>
        <Image style={{alignSelf: 'center', marginVertical: 20, width: widescreen ? 400 : 300, height: widescreen ? 145 : 109, resizeMode: 'contain'}} source={require('../../assets/step_2.png')} />
        <HText style={{color: Colors.text_title, fontSize: widescreen ? 18 : 14}}>
          Download the file. You can leave the default name or change it, but it <HText style={{fontWeight: 'bold'}}>must</HText> stay a <HText style={{fontStyle: 'italic'}}>.zip</HText> archive.
        </HText>
        <Image style={{alignSelf: 'center', marginVertical: 20, width: widescreen ? 400 : 300, height: widescreen ? 245 : 183, resizeMode: 'contain'}} source={require('../../assets/step_3.png')} />
        <HText style={{color: Colors.text_title, fontSize: widescreen ? 18 : 14}}>
          Upload your data to Heteroboxd!
        </HText>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            alignSelf: 'center',
            marginTop: 20,
            marginBottom: 30,
            width: widescreen ? 400 : 200,
            height: widescreen ? 200 : 100,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderRadius: 5,
            borderColor: isDragging ? Colors.text_title : file ? Colors._heteroboxd : Colors.heteroboxd,
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? 'rgba(255,255,255,0.05)' : 'transparent',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <HText style={{color: file ? Colors._heteroboxd : Colors.heteroboxd, textAlign: 'center', paddingHorizontal: 20}}>
            {file ? file.name : widescreen ? 'Choose a file from your device or drag & drop it here' : 'Choose a file from your device'}
          </HText>
          <input ref={inputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
        <Pressable onPress={handleUpload} disabled={!file} style={[{width: 150, alignSelf: 'center', padding: 15, backgroundColor: Colors.heteroboxd, borderRadius: 5}, !file && {opacity: 0.5}]}>
          <HText style={{fontSize: widescreen ? 18 : 14, fontWeight: 'bold', color: Colors.text_button, textAlign: 'center'}}>IMPORT</HText>
        </Pressable>
        <HText style={{marginTop: 7.5, color: Colors.text, textAlign: 'center', fontSize: widescreen ? 18 : 14}}>Already uploaded a file? Check the status of your import <Link style={{color: Colors.heteroboxd}} href='https://www.heteroboxd.com/import/status'>here</Link>.</HText>

        <View style={{height: widescreen ? 100 : 25}} />
        <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: '400', textAlign: 'center', lineHeight: 24}}>
          the <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}>L</HText> in Letterboxd stands for 
          <HText style={{ color: Colors.heteroboxd, fontWeight: '400' }}> Loser</HText>
          {'\n'}
          the <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}>H</HText> in Heteroboxd stands for 
          <HText style={{ color: Colors._heteroboxd, fontWeight: '400' }}> Winner</HText>
          {'\n'}
          <HText style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16, fontWeight: '700' }}>
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