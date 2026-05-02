import { Text, View, ScrollView, useWindowDimensions, Pressable } from 'react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Colors } from '../../constants/colors'
import Refresh from '../../assets/icons/refresh.svg'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import * as auth from '../../helpers/auth'
import { Response } from '../../constants/response'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import Head from 'expo-router/head'
import { useRouter } from 'expo-router'
import HText from '../../components/htext'
import { Link } from 'expo-router'

const COLOR_MAP = {
  'PENDING': Colors.text,
  'RUNNING': Colors.password_solid,
  'FAILED': Colors.password_meager,
  'COMPLETED': Colors.password_strong
}

const MSG_MAP = {
  'PENDING': 'Hang back and relax. It usually takes around 15 minutes for your import to leave the queue.',
  'RUNNING': 'Feel free to continue using Heteroboxd while we parse your files and add your history.',
  'FAILED': 'Something went wrong while we tried parsing your data. Please make sure you upladed the EXACT archive Letterboxd gave you, and try again.',
  'COMPLETED': `Yes, that's really it! Your migration from Letterboxd is complete.`
}

const Status = () => {
  const [ status, setStatus ] = useState(null)
  const { user, isValidSession } = useAuth()
  const [ server, setServer ] = useState(Response.initial)
  const { width } = useWindowDimensions()
  const router = useRouter()

  const loadStatus = useCallback(async (fromRechek) => {
    if (!user || !(await isValidSession())) {
      router.replace('login')
    }
    if (fromRechek) setStatus(null)
    if (user.lb && status !== 'COMPLETED') {
      setStatus('NONE')
      setServer(Response.ok)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/imports/status`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        setStatus(await res.text())
        setServer(Response.ok)
      } else if (res.status === 404) {
        setStatus('NONE')
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [router, user])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const widescreen = useMemo(() => width > 1000, [width])

  if (!status) {
    return (
      <>
      <Head>
        <title>Check your Migration Status</title>
        <meta name="description" content="Check the status of your Letterboxd migration." />
        <meta property="og:title" content="Check your Migration Status" />
        <meta property="og:description" content="Check the status of your Letterboxd migration." />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
      </>
    )
  }

  if (status === 'NONE') {
    return (
      <>
      <Head>
        <title>Check your Migration Status</title>
        <meta name="description" content="Check the status of your Letterboxd migration." />
        <meta property="og:title" content="Check your Migration Status" />
        <meta property="og:description" content="Check the status of your Letterboxd migration." />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background}}>
        <ScrollView contentContainerStyle={{width: Math.min(width*0.9, 1000), flexGrow: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center'}} showsVerticalScrollIndicator={false}>
          <HText style={{fontSize: widescreen ? 32 : 24, fontWeight: '700', textAlign: 'center'}}>
            <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
          </HText>
          <View style={{height: widescreen ? 200 : 50}} />
          <HText style={{fontSize: widescreen ? 20 : 16, fontWeight: '500', textAlign: 'center', color: Colors.text_title}}>
            You have no ongoing or scheduled data imports in our queue. <Link style={{color: Colors.heteroboxd}} href='/import/data'>Are you in the right place?</Link>
          </HText>
          <View style={{height: widescreen ? 200 : 50}} />
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
        <title>Check your Migration Status</title>
        <meta name="description" content="Check the status of your Letterboxd migration." />
        <meta property="og:title" content="Check your Migration Status" />
        <meta property="og:description" content="Check the status of your Letterboxd migration." />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background}}>
        <ScrollView contentContainerStyle={{width: Math.min(width*0.9, 1000), flexGrow: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center'}} showsVerticalScrollIndicator={false}>
          <HText style={{fontSize: widescreen ? 32 : 24, fontWeight: '700', textAlign: 'center'}}>
            <HText style={{color: '#ffffff'}}>Migrate from </HText><Link href='https://letterboxd.com/settings/data/' target='_blank'><HText style={{color: '#ff8000'}}>Let</HText><HText style={{color: '#00e054'}}>ter</HText><HText style={{color: '#40bcf4'}}>boxd</HText></Link>
          </HText>
          <View style={{height: widescreen ? 175 : 50}} />
          <HText style={{lineHeight: 40, color: Colors.text_title, fontSize: widescreen ? 20 : 16, fontWeight: '500', textAlign: 'center'}}>
            The current status of your data import is{'\n'}<HText style={{color: COLOR_MAP[status], fontWeight: 'bold', fontSize: widescreen ? 32 : 24}}>{status}</HText>
          </HText>
          <HText style={{marginTop: widescreen ? 30 : 20, marginBottom: 10, lineHeight: 30, color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: '400', textAlign: 'center'}}>{MSG_MAP[status]}</HText>
          {!['COMPLETED', 'FAILED'].includes(status) && <Pressable onPress={() => loadStatus(true)} style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', backgroundColor: Colors.heteroboxd, padding: 10, borderRadius: 5}}>
            <HText style={{color: Colors.text_button, fontSize: widescreen ? 18 : 14}}>RECHECK </HText>
            <Refresh width={widescreen ? 22 : 18} height={widescreen ? 22 : 18} />
          </Pressable>}
          <View style={{height: widescreen ? 175 : 50}} />
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
        <Popup
          visible={[500].includes(server.result)}
          message={server.message}
          onClose={() => router.replace('/contact')}
        />
      </View>
    </>
  )
}

export default Status