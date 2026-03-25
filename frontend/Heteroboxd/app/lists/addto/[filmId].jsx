import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, useWindowDimensions, FlatList, View, Pressable } from 'react-native'
import { useAuth } from '../../../hooks/useAuth'
import { useRouter, useLocalSearchParams, useNavigation, Link } from 'expo-router'
import Plus from '../../../assets/icons/plus.svg'
import Check from '../../../assets/icons/check.svg'
import Minus from '../../../assets/icons/minus.svg'
import * as auth from '../../../helpers/auth'
import * as format from '../../../helpers/format'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { UserAvatar } from '../../../components/userAvatar'

const PAGE_SIZE = 20

const AddToLists = () => {
  const { filmId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ server, setServer ] = useState(Response.initial)
  const [ usersLists, setUsersLists ] = useState({ page: 1, lists: [], totalCount: 0 })
  const [ selectedIds, setSelectedIds ] = useState([])
  const router = useRouter()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const listRef = useRef(null)
  const requestRef = useRef(0)
  const loadingRef = useRef(false)

  const fetchLists = useCallback(async (page) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      if (loadingRef.current) return
      const jwt = await auth.getJwt()
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(`${BaseUrl.api}/lists/film-interact?FilmId=${filmId}&Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setUsersLists({ page: json.page, lists: json.items, totalCount: json.totalCount })
        } else {
          setUsersLists(prev => ({...prev, page: json.page, lists: prev.lists.length > 1000 ? [...prev.lists.slice(-980), ...json.items] : [...prev.lists, ...json.items]}))
        }
        setServer(Response.ok)
        loadingRef.current = false
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
        loadingRef.current = false
      }
    } catch {
      setServer(Response.networkError)
      loadingRef.current = false
    }
  }, [user, filmId])

  const totalPages = useMemo(() => Math.ceil(usersLists.totalCount / PAGE_SIZE), [usersLists.totalCount])

  const loadNextPage = useCallback(() => {
    if (usersLists.page < totalPages) {
      fetchLists(usersLists.page + 1)
    }
  }, [usersLists.page, totalPages, fetchLists])

  const addToLists = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const lists = usersLists.lists.filter(item => selectedIds.includes(item.listId)).map(item => ({ key: item.listId, value: item.size }))
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          FilmId: filmId,
          Lists: lists
        })
      })
      if (!res.ok) {
        setServer(Response.internalServerError)
        return
      }
      router.replace(`/film/${filmId}`)
    } catch {
      setServer(Response.networkError)
    }
  }, [user, usersLists, selectedIds, filmId, router])

  const toggle = useCallback((id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id))
    } else {
      setSelectedIds(prev => [...prev, id])
    }
  }, [selectedIds])

  const isToggled = useCallback((id) => selectedIds.includes(id), [selectedIds])

  useEffect(() => {
    fetchLists(1)
  }, [fetchLists])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Add to lists',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={addToLists} disabled={selectedIds.length === 0} style={[{marginRight: widescreen ? 15 : null}, (selectedIds.length === 0) && {opacity: 0.5}]}>
          <Check height={20} width={20} />
        </Pressable>
      )
    })
  }, [navigation, widescreen, addToLists])

  const List = useCallback(({item}) => {
    if (item.containsFilm) {
      return (
        <View style={{width: width*0.75, backgroundColor: Colors.card, borderRadius: 5, borderWidth: 2, borderColor: Colors.border_color, marginVertical: 10}}>
          <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 10, opacity: 0.75}}>
            <Check height={20} width={20} />
            <View>
              <HText style={{fontWeigth: '500', fontSize: widescreen ? 16 : 12, color: Colors.text_title}}>{format.sliceText(item.listName || '', widescreen ? 80 : 40)}</HText>
              <HText style={{fontWeigth: '400', fontSize: widescreen ? 15 : 11, color: Colors.text}}>Entries: {item.size}</HText>
            </View>
            <UserAvatar
              pictureUrl={user?.pictureUrl || null}
              style={{
                width: widescreen ? 40 : 30,
                height: widescreen ? 40 : 30,
                borderRadius: widescreen ? 20 : 15,
                borderWidth: 1,
                borderColor: Colors.border_color
              }}
            />
          </View>
        </View>
      )
    } else if (isToggled(item.listId)) {
      return (
        <Pressable onPress={() => toggle(item.listId)} style={{width: width*0.75, marginVertical: 10}}>
          <View style={{backgroundColor: Colors.card, borderRadius: 5, borderWidth: 2, borderColor: Colors._heteroboxd}}>
            <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
              <Minus height={20} width={20} />
              <View>
                <HText style={{fontWeigth: '500', fontSize: widescreen ? 16 : 12, color: Colors.text_title}}>{format.sliceText(item.listName || '', widescreen ? 80 : 40)}</HText>
                <HText style={{fontWeigth: '400', fontSize: widescreen ? 15 : 11, color: Colors.text}}>Entries: {item.size}</HText>
              </View>
              <UserAvatar
                pictureUrl={user?.pictureUrl || null}
                style={{
                  width: widescreen ? 40 : 30,
                  height: widescreen ? 40 : 30,
                  borderRadius: widescreen ? 20 : 15,
                  borderWidth: 1,
                  borderColor: Colors.border_color
                }}
              />
            </View>
          </View>
        </Pressable>
      )
    } else {
      return (
        <Pressable onPress={() => toggle(item.listId)} style={{width: width*0.75, marginVertical: 10}}>
          <View style={{backgroundColor: Colors.background, borderRadius: 5, borderWidth: 2, borderColor: Colors.heteroboxd}}>
            <View style={{alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 10}}>
              <Plus height={20} width={20} />
              <View>
                <HText style={{fontWeigth: '500', fontSize: widescreen ? 16 : 12, color: Colors.text_title}}>{format.sliceText(item.listName || '', widescreen ? 80 : 40)}</HText>
                <HText style={{fontWeigth: '400', fontSize: widescreen ? 15 : 11, color: Colors.text}}>Entries: {item.size}</HText>
              </View>
              <UserAvatar
                pictureUrl={user?.pictureUrl || null}
                style={{
                  width: widescreen ? 40 : 30,
                  height: widescreen ? 40 : 30,
                  borderRadius: widescreen ? 20 : 15,
                  borderWidth: 1,
                  borderColor: Colors.border_color
                }}
              />
            </View>
          </View>
        </Pressable>
      )
    }
  }, [user, widescreen, isToggled, toggle])

  const Footer = useMemo(() => usersLists.lists.length > 0 && server.result === 0 ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [usersLists.lists.length, server])

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={usersLists.lists}
        keyExtractor={(item) => item.listId.toString()}
        ListEmptyComponent={server.result > 0 && (
          <View>
            <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>
              Nothing to see here.{'\n'}
              <Link style={{color: Colors.text_link}} href='list/create'>Create one now!</Link>
            </HText>
          </View>
        )}
        renderItem={List}
        ListFooterComponent={Footer}
        contentContainerStyle={{paddingBottom: 80, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
      />

      <LoadingResponse visible={usersLists.lists.length === 0 && server.result <= 0} />
      <Popup
        visible={server.result === 500}
        message={server.message}
        onClose={() => router.replace('/contact')}
      />
    </View>
  )
}

export default AddToLists