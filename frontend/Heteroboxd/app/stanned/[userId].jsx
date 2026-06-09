import { View, ActivityIndicator, FlatList, Pressable, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Response } from '../../constants/response'
import Head from 'expo-router/head'
import { Colors } from '../../constants/colors'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import { Headshot } from '../../components/headshot'
import { BaseUrl } from '../../constants/api'
import * as format from '../../helpers/format'

const PAGE_SIZE = 20

const Stanned = () => {
  const { userId } = useLocalSearchParams()
  const [ server, setServer ] = useState(Response.initial)
  const [ data, setData ] = useState({ page: 1, celebs: [], totalCount: 0 })
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const listRef = useRef(null)
  const lastPageRef = useRef(0)
  const requestRef = useRef(0)

  const fetchData = useCallback(async (page) => {
    if (page !== 1 && lastPageRef.current >= page) {
      return
    }
    setServer(Response.loading)
    try {
      const requestId = ++requestRef.current
      const res = await fetch(`${BaseUrl.api}/users/celebrities?UserId=${userId}&Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setData({ page: json.page, celebs: json.items, totalCount: json.totalCount })
        } else {
          setData(prev => ({...prev, page: json.page, celebs: prev.celebs.length > 1000 ? [...prev.celebs.slice(-980), ...json.items] : [...prev.celebs, ...json.items]}))
        }
        lastPageRef.current = page
        setServer(Response.ok)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId])

  const totalPages = useMemo(() => Math.ceil(data.totalCount / PAGE_SIZE), [data.totalCount])

  const loadNextPage = useCallback(() => {
    if (data.page < totalPages) {
      fetchData(data.page + 1)
    }
  }, [data.page, totalPages, fetchData])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Stanned Celebrities',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'}
    })
  }, [navigation])

  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const headshotDim = useMemo(() => widescreen ? 100 : 72, [widescreen])

  const Celeb = useCallback(({ item }) => (
    <>
      <Pressable onPress={() => router.push(`/celebrity/${item.id}`)}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 3}}>
          <View>
            <Headshot
              pictureUrl={item.headshotUrl || null}
              style={{
                width: headshotDim,
                height: headshotDim,
                borderColor: Colors.border_color,
                borderWidth: 1,
                borderRadius: headshotDim / 2,
                marginRight: widescreen ? 10 : 5
              }}
            />
          </View>
          <View>
            <HText style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 20 : 16, color: Colors.text, fontWeight: '700'}}>{item.name}</HText>
            <HText style={{color: Colors.text, fontSize: widescreen ? 16 : 12, marginTop: 5, opacity: 0.8}}>{format.formatCount(item.stanCount)} stans</HText>
          </View>
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  ), [router, headshotDim, widescreen, spacing])

  const Footer = useMemo(() => data.celebs.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [data.celebs.length, server])

  return (
    <>
    <Head>
      <title>Stanned Celebrities</title>
      <meta name="description" content="Celebrities the user stans." />
      <meta property="og:title" content="Stanned Celebrities" />
      <meta property="og:description" content="Celebrities the user stans." />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <View style={{flex: 1, width: widescreen ? 1000 : '95%', alignSelf: 'center'}}>
        <FlatList
          ref={listRef}
          data={data.celebs}
          keyExtractor={(item, index) => item ? item.id.toString() : `placeholder-${index}`}
          ListEmptyComponent={server.result > 0 && (
            <View>
              <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>
                Nothing to see here.
              </HText>
            </View>
          )}
          ListHeaderComponent={
            <View>
              <HText style={{color: Colors.text, fontSize: widescreen ? 16 : 12, textAlign: 'center', padding: 15}}>
                By stanning a celebrity, you are subscribing to recieve notifications on their future credits.
              </HText>
            </View>
          }
          renderItem={Celeb}
          ListFooterComponent={Footer}
          contentContainerStyle={{paddingBottom: 80}}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.2}
          onEndReached={loadNextPage}
          keyboardShouldPersistTaps={"handled"}
        />
      </View>
      <LoadingResponse visible={data.celebs.length === 0 && server.result <= 0} />
      <Popup
        visible={server.result === 500}
        message={server.message}
        onClose={() => router.replace('/contact')}
      />
    </View>
    </>
  )
}

export default Stanned