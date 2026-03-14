import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../../helpers/auth'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import Divider from '../../../components/divider'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import ParsedInput from '../../../components/parsedInput'
import { Poster } from '../../../components/poster'
import Popup from '../../../components/popup'
import Stars from '../../../components/stars'

const AlterReview = () => {

  const { filmId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ film, setFilm ] = useState({ title: '', year: 0, posterUrl: '' })
  const [ review, setReview ] = useState({ id: null, rating: 0, text: '', spoiler: false })
  const [ initial, setInitial ] = useState(null)
  const { width, height } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const [ server, setServer ] = useState(Response.initial)

  const loadData = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/reviews/user-film?FilmId=${filmId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setFilm({title: json?.filmTitle, year: json?.filmReleaseYear, posterUrl: json?.filmPosterUrl})
        setReview({id: (json?.id && json?.id.length > 0) ? json?.id : null, rating: json?.rating ?? 0, text: json?.text ?? '', spoiler: json.spoiler ?? false})
        if (json.text?.length > 0) {
          setInitial(json.text)
        }
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [filmId, user, isValidSession])

  const handleSubmit = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      let res
      if (!review.id) {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            Rating: review.rating,
            Text: review.text,
            Spoiler: review.spoiler,
            AuthorId: user?.userId,
            FilmId: filmId
          })
        })
        if (res.ok) {
          const json = await res.json()
          setServer(Response.ok)
          router.replace(`/review/${json.id}`)
        } else {
          setServer(Response.internalServerError)
        }
      } else {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({
            ReviewId: review.id,
            Rating: review.rating,
            Text: review.text,
            Spoiler: review.spoiler,
          })
        })
        if (res.ok) {
          setServer(Response.ok);
          router.replace(`/review/${review.id}`)
        } else {
          setServer(Response.internalServerError)
        }
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [filmId, user, isValidSession, review, router])

  const widescreen = useMemo(() => width > 1000, [width])
  
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Rate and review',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={handleSubmit} style={{marginRight: widescreen ? 15 : null}}>
          <Ionicons name='checkmark' size={24} color={Colors.text_title} />
        </Pressable>
      )
    })
  }, [navigation, handleSubmit])

  useEffect(() => {
    loadData()
  }, [loadData])

  const posterWidth = useMemo(() => widescreen ? 120 : 80, [widescreen])
  const posterHeight = useMemo(() => posterWidth * 3 / 2, [posterWidth])

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center'}}>
      <KeyboardAvoidingView behavior='padding' style={{alignSelf: 'center', alignItems: 'center', width: widescreen ? 1000 : width*0.95}}>
        <ScrollView
          contentContainerStyle={{alignItems: 'center', paddingBottom: 100, flexGrow: 1}}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', width: '95%', justifyContent: 'flex-start'}}>
            <Poster
              posterUrl={film.posterUrl}
              style={{
                width: posterWidth,
                height: posterHeight,
                borderWidth: 2,
                borderRadius: 4,
                marginRight: 5,
                borderColor: Colors.border_color
              }}
            />
            <HText style={{color: Colors.text_title, fontWeight: '400', fontSize: widescreen ? 20 : 16, textAlign: 'left', flex: 1, flexWrap: 'wrap'}}>
              {film.title} <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14}}>{film.year || ''}</HText>
            </HText>
          </View>

          <Divider marginVertical={15} />

          <View style={{marginBottom: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: '100%'}}>
            <Stars
              size={widescreen ? 50 : 40}
              rating={review.rating}
              onRatingChange={(newRating) => setReview(prev => ({ ...prev, rating: newRating }))}
              padding={false}
            />
            <Pressable onPress={() => setReview(prev => ({ ...prev, spoiler: !prev.spoiler }))} style={{alignItems: 'center'}}>
              {
                !review.spoiler ? (
                  <>
                    <Ionicons name='warning-outline' size={widescreen ? 30 : 24} color={Colors.text} />
                    <HText style={{color: Colors.text, fontSize: widescreen ? 16 : 13, marginTop: -2}}>Spoilers</HText>
                  </>
                ) : (
                  <>
                    <Ionicons name='warning' size={widescreen ? 30 : 24} color={Colors.heteroboxd} />
                    <HText style={{color: Colors.heteroboxd, fontSize: widescreen ? 16 : 13, marginTop: -2}}>Spoilers</HText>
                  </>
                )
              }
            </Pressable>
          </View>

          <ParsedInput initial={initial} width={width} height={height} onValueChange={(r) => setReview(prev => ({ ...prev, text: r }))} />
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingResponse visible={server.result <= 0} />
      <Popup
        visible={[403, 500].includes(server.result)}
        message={server.message}
        onClose={() => server.result === 403 ? router.replace('/login') : router.replace('/contact')}
      />
    </View>
  )
}

export default AlterReview