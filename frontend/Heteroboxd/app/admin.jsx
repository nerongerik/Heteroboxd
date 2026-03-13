import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Linking, Platform, Pressable, TextInput, useWindowDimensions, View } from 'react-native'
import { MaterialCommunityIcons, Fontisto, Ionicons } from '@expo/vector-icons'
import { Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as auth from '../helpers/auth'
import { useAuth } from '../hooks/useAuth'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import { Response } from '../constants/response'
import HText from '../components/htext'
import LoadingResponse from '../components/loadingResponse'
import PaginationBar from '../components/paginationBar'
import { UserAvatar } from '../components/userAvatar'
import * as format from '../helpers/format'

const PAGE_SIZE = 20

const Admin = () => {
  const [ aJwt, setAJwt ] = useState(null)
  const [ timeLeft, setTimeLeft ] = useState(-1)
  const [ key, setKey ] = useState('')
  const { user, isValidSession } = useAuth()
  const router = useRouter()
  const { width, height } = useWindowDimensions()
  const [ servers, setServers ] = useState({ admin: Response.initial, users: Response.initial, lists: Response.initial, reviews: Response.initial, comments: Response.initial, delete: Response.initial })
  const [ users, setUsers ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ lists, setLists ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ reviews, setReviews ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ comments, setComments ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ search, setSearch ] = useState({ users: ['user', ''], lists: ['list', ''], reviews: ['review', ''], comments: ['comment', ''] })

  const handleSubmitKey = useCallback(async () => {
    if (!(await isValidSession())) {
      setServers(prev => ({...prev, admin: Response.forbidden}))
      return
    }
    setServers(prev => ({...prev, admin: Response.loading}))
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/auth/admin?Key=${key}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const text = await res.text()
        setAJwt(text)
        setServers(prev => ({...prev, admin: Response.ok}))
      } else if (res.status === 400) {
        setServers(prev => ({...prev, admin: Response.badRequest}))
      } else {
        setServers(prev => ({...prev, admin: Response.internalServerError}))
      }
    } catch {
      setServers(prev => ({...prev, admin: Response.networkError}))
    }
  }, [user, key])

  const getUsers = async (page) => {
    setServers(prev => ({...prev, users: Response.loading}))
    try {
      const res = await fetch(`${BaseUrl.api}/admin/users?Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${aJwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setUsers({ page: json.page, items: json.items, totalCount: json.totalCount })
        setServers(prev => ({...prev, users: Response.ok}))
      } else {
        setServers(prev => ({...prev, users: Response.internalServerError}))
      }
    } catch {
      setServers(prev => ({...prev, users: Response.networkError}))
    }
  }

  const getLists = async (page) => {
    setServers(prev => ({...prev, lists: Response.loading}))
    try {
      const res = await fetch(`${BaseUrl.api}/admin/lists?Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${aJwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setLists({ page: json.page, items: json.items, totalCount: json.totalCount })
        setServers(prev => ({...prev, lists: Response.ok}))
      } else {
        setServers(prev => ({...prev, lists: Response.internalServerError}))
      }
    } catch {
      setServers(prev => ({...prev, lists: Response.networkError}))
    }
  }

  const getReviews = async (page) => {
    setServers(prev => ({...prev, reviews: Response.loading}))
    try {
      const res = await fetch(`${BaseUrl.api}/admin/reviews?Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${aJwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setReviews({ page: json.page, items: json.items, totalCount: json.totalCount })
        setServers(prev => ({...prev, reviews: Response.ok}))
      } else {
        setServers(prev => ({...prev, reviews: Response.internalServerError}))
      }
    } catch {
      setServers(prev => ({...prev, reviews: Response.networkError}))
    }
  }

  const getComments = async (page) => {
    setServers(prev => ({...prev, comments: Response.loading}))
    try {
      const res = await fetch(`${BaseUrl.api}/admin/comments?Page=${page}&PageSize=${PAGE_SIZE}`, {
        headers: { 'Authorization': `Bearer ${aJwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setComments({ page: json.page, items: json.items, totalCount: json.totalCount })
        setServers(prev => ({...prev, comments: Response.ok}))
      } else {
        setServers(prev => ({...prev, comments: Response.internalServerError}))
      }
    } catch {
      setServers(prev => ({...prev, comments: Response.networkError}))
    }
  }

  const handleDelete = async (context, id, callback) => {
    setServers(prev => ({...prev, delete: Response.loading}))
    try {
      const res = await fetch(`${BaseUrl.api}/admin?Context=${context}&Id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${aJwt}` }
      })
      if (res.ok) {
        setServers(prev => ({...prev, delete: Response.ok}))
        callback()
      } else if (res.status === 400) {
        setServers(prev => ({...prev, delete: Response.badRequest}))
      } else {
        setServers(prev => ({...prev, delete: Response.internalServerError}))
      }
    } catch {
      setServers(prev => ({...prev, delete: Response.networkError}))
    }
  }

  const handleSearch = async (params, callback) => {
    try {
      const res = await fetch(`${BaseUrl.api}/admin?Context=${params[0]}&Id=${params[1]}`, {
        headers: { 'Authorization': `Bearer ${aJwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        callback(json)
      } else {
        callback(null)
      }
    } catch {
      callback(null)
    }
  }

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web' || !user?.admin || !(await isValidSession())) {
        router.replace('/login')
      }
    })()
  }, [user, router])

  useEffect(() => {
    if (!aJwt) return
    getUsers(1)
    getLists(1)
    getReviews(1)
    getComments(1)
  }, [aJwt])

  useEffect(() => {
    if (!aJwt) return
    setTimeLeft(30 * 60)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [aJwt])

  const UserHeader = useMemo(() => (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
      <Pressable onPress={() => {setSearch(prev => ({...prev, users: ['user', '']})); getUsers(1)}} style={{padding: 5, alignContent: 'center'}}>
        <Ionicons name='refresh-circle' size={24} color={Colors.text_button} />
      </Pressable>
      <TextInput
        value={search.users[1]}
        onChangeText={(q) => setSearch(prev => ({...prev, users: ['user', q]}))}
        placeholder='ID of User to find...'
        style={{
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: Colors.border_color,
          borderRadius: 7,
          padding: 10,
          paddingHorizontal: 10,
          overflow: 'hidden',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          color: Colors.text_input,
          fontSize: 16,
          width: '75%',
          marginVertical: 20,
          alignSelf: 'center'
        }}
      />
      <Pressable
        onPress={() => {
          setServers(prev => ({...prev, users: Response.loading}))
          handleSearch(search.users, (data) => {data ? setUsers({ page: 1, items: [data], totalCount: 1}) : setUsers({ page: 1, items: [], totalCount: 0}); setServers(prev => ({...prev, users: data ? Response.ok : Response.notFound}))})
        }}
        style={{padding: 5, alignContent: 'center'}}
      >
        <Fontisto name='search' size={20} color={Colors.text_button} />
      </Pressable>
    </View>
  ), [search, width])

  const ListHeader = useMemo(() => (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
      <Pressable onPress={() => {setSearch(prev => ({...prev, lists: ['list', '']})); getLists(1)}} style={{padding: 5, alignContent: 'center'}}>
        <Ionicons name='refresh-circle' size={24} color={Colors.text_button} />
      </Pressable>
      <TextInput
        value={search.lists[1]}
        onChangeText={(q) => setSearch(prev => ({...prev, lists: ['list', q]}))}
        placeholder='ID of List to find...'
        style={{
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: Colors.border_color,
          borderRadius: 7,
          padding: 10,
          paddingHorizontal: 10,
          overflow: 'hidden',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          color: Colors.text_input,
          fontSize: 16,
          width: '75%',
          marginVertical: 20,
          alignSelf: 'center'
        }}
      />
      <Pressable
        onPress={() => {
          setServers(prev => ({...prev, lists: Response.loading}))
          handleSearch(search.lists, (data) => {data ? setLists({ page: 1, items: [data], totalCount: 1}) : setLists({ page: 1, items: [], totalCount: 0}); setServers(prev => ({...prev, lists: data ? Response.ok : Response.notFound}))})
        }}
        style={{padding: 5, alignContent: 'center'}}
      >
        <Fontisto name='search' size={20} color={Colors.text_button} />
      </Pressable>
    </View>
  ), [search, width])

  const ReviewHeader = useMemo(() => (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
      <Pressable onPress={() => {setSearch(prev => ({...prev, reviews: ['review', '']})); getReviews(1)}} style={{padding: 5, alignContent: 'center'}}>
        <Ionicons name='refresh-circle' size={24} color={Colors.text_button} />
      </Pressable>
      <TextInput
        value={search.reviews[1]}
        onChangeText={(q) => setSearch(prev => ({...prev, reviews: ['review', q]}))}
        placeholder='ID of Review to find...'
        style={{
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: Colors.border_color,
          borderRadius: 7,
          padding: 10,
          paddingHorizontal: 10,
          overflow: 'hidden',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          color: Colors.text_input,
          fontSize: 16,
          width: '75%',
          marginVertical: 20,
          alignSelf: 'center'
        }}
      />
      <Pressable
        onPress={() => {
          setServers(prev => ({...prev, reviews: Response.loading}))
          handleSearch(search.reviews, (data) => {data ? setReviews({ page: 1, items: [data], totalCount: 1}) : setReviews({ page: 1, items: [], totalCount: 0}); setServers(prev => ({...prev, reviews: data ? Response.ok : Response.notFound}))})
        }}
        style={{padding: 5, alignContent: 'center'}}
      >
        <Fontisto name='search' size={20} color={Colors.text_button} />
      </Pressable>
    </View>
  ), [search, width])

  const CommentHeader = useMemo(() => (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
      <Pressable onPress={() => {setSearch(prev => ({...prev, comments: ['comment', '']})); getComments(1)}} style={{padding: 5, alignContent: 'center'}}>
        <Ionicons name='refresh-circle' size={24} color={Colors.text_button} />
      </Pressable>
      <TextInput
        value={search.comments[1]}
        onChangeText={(q) => setSearch(prev => ({...prev, comments: ['comment', q]}))}
        placeholder='ID of Comment to find...'
        style={{
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: Colors.border_color,
          borderRadius: 7,
          padding: 10,
          paddingHorizontal: 10,
          overflow: 'hidden',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          color: Colors.text_input,
          fontSize: 16,
          width: '75%',
          marginVertical: 20,
          alignSelf: 'center'
        }}
      />
      <Pressable
        onPress={() => {
          setServers(prev => ({...prev, comments: Response.loading}))
          handleSearch(search.comments, (data) => {data ? setComments({ page: 1, items: [data], totalCount: 1}) : setComments({ page: 1, items: [], totalCount: 0}); setServers(prev => ({...prev, comments: data ? Response.ok : Response.notFound}))})
        }}
        style={{padding: 5, alignContent: 'center'}}
      >
        <Fontisto name='search' size={20} color={Colors.text_button} />
      </Pressable>
    </View>
  ), [search, width])

  if (!aJwt) {
    return (
      <View style={{alignContent: 'center', justifyContent: 'center', flex: 1, backgroundColor: Colors.background}}>
        <HText style={{textAlign: 'center', color: Colors.text_title, fontSize: 20, fontWeight: '600', paddingHorizontal: 10}}>Admin Dashboard Key:</HText>
        <TextInput
          value={key}
          onChangeText={setKey}
          style={{
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: Colors.border_color,
            borderRadius: 7,
            padding: 10,
            paddingHorizontal: 10,
            overflow: 'hidden',
            outlineStyle: 'none',
            outlineWidth: 0,
            outlineColor: 'transparent',
            color: Colors.text_input,
            fontSize: 16,
            width: width / 4,
            marginVertical: 20,
            alignSelf: 'center'
          }}
        />
        <Pressable
          style={[{backgroundColor: Colors.heteroboxd, width: 'auto', padding: 10, borderRadius: 10, alignSelf: 'center'}, key.length === 0 && { opacity: 0.5 }]}
          onPress={handleSubmitKey}
          disabled={key.length === 0}
        >
          <HText style={{color: Colors.text_button, fontWeight: '500', textAlign: 'center'}}>Submit</HText>
        </Pressable>

        <LoadingResponse visible={servers.admin.result === 0} />
        <Snackbar
          visible={[400, 500].includes(servers.admin.result)}
          onDismiss={() => setServers(prev => ({...prev, admin: Response.initial}))}
          duration={3000}
          style={{
            backgroundColor: Colors.card,
            width: '50%',
            alignSelf: 'center',
            borderRadius: 8
          }}
          action={{
            label: 'OK',
            onPress: () => setServers(prev => ({...prev, admin: Response.initial})),
            textColor: Colors.text_link,
          }}
        >
          {servers.admin.message}
        </Snackbar>
      </View>
    )
  }

  const timerColor = timeLeft > 15 * 60
    ? Colors.password_strong
    : timeLeft > 3 * 60
      ? Colors.password_solid
      : Colors.password_meager
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, paddingHorizontal: 10}}>
      <HText style={{
        textAlign: 'center',
        color: timerColor,
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 10
      }}>
        {minutes}:{seconds}
      </HText>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <View style={{width: width/4.1, height: height*0.8, borderWidth: 3, borderRadius: 10, borderColor: Colors.border_color}}>
          <FlatList
            data={users.items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={UserHeader}
            renderItem={({item}) => (
              <View style={{backgroundColor: Colors.card, padding: 10, borderRadius: 5, marginBottom: 20, width: width/4.1 - 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Pressable style={{width: (width/4.1 - 20)/3*2}} onPress={() => Linking.openURL(`/profile/${item.id}`)}>
                  <View style={{alignItems: 'center', flexDirection: 'row'}}>
                    <UserAvatar
                      pictureUrl={item.pictureUrl || null}
                      style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}}
                    />
                    <HText style={{fontSize: 20, fontWeight: '600', color: Colors.text_title}}>{format.sliceText(item.name, 20)}</HText>
                  </View>
                </Pressable>
                <Pressable style={{flexDirection: 'row', alignItems: 'flex-end'}} onPress={() => handleDelete('user', item.id, () => getUsers(users.page))}>
                  <HText style={{fontSize: 20, fontWeight: '600', color: Colors.heteroboxd}}>{item.flags}</HText>
                  <MaterialCommunityIcons name='delete' size={24} color={Colors.text} />
                </Pressable>
              </View>
            )}
            ListFooterComponent={
              <PaginationBar
                page={users.page}
                totalPages={Math.ceil(users.totalCount / PAGE_SIZE)}
                onPagePress={(num) => { getUsers(num) }}
              />
            }
            ListEmptyComponent={
              servers.users.result === 0
              ? <View style={{alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>
              : <HText style={{textAlign: 'center', color: Colors.text, padding: 5, fontSize: 20}}>Nothing to see here.</HText>
            }
            style={{alignSelf: 'center'}}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <View style={{width: width/4.1, height: height*0.8, borderWidth: 3, borderRadius: 10, borderColor: Colors.border_color}}>
          <FlatList
            data={lists.items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeader}
            renderItem={({item}) => (
              <View style={{backgroundColor: Colors.card, padding: 10, borderRadius: 5, marginBottom: 20, width: width/4.1 - 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Pressable style={{width: (width/4.1 - 20)/3*2}} onPress={() => Linking.openURL(`/list/${item.id}`)}>
                  <View>
                    <HText style={{fontSize: 20, fontWeight: '600', color: Colors.text_title}}>{format.sliceText(item.name, 30)}</HText>
                    <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Entries: {item.listEntryCount}</HText>
                  </View>
                </Pressable>
                <Pressable style={{flexDirection: 'row', alignItems: 'flex-end'}} onPress={() => handleDelete('list', item.id, () => getLists(lists.page))}>
                  <HText style={{fontSize: 20, fontWeight: '600', color: Colors.heteroboxd}}>{item.flags}</HText>
                  <MaterialCommunityIcons name='delete' size={24} color={Colors.text} />
                </Pressable>
              </View>
            )}
            ListFooterComponent={
              <PaginationBar
                page={lists.page}
                totalPages={Math.ceil(lists.totalCount / PAGE_SIZE)}
                onPagePress={(num) => { getLists(num) }}
              />
            }
            ListEmptyComponent={
              servers.lists.result === 0
              ? <View style={{alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>
              : <HText style={{textAlign: 'center', color: Colors.text, padding: 5, fontSize: 20}}>Nothing to see here.</HText>
            }
            style={{alignSelf: 'center'}}
            showsVerticalScrollIndicator={false}
          />        
        </View>
        <View style={{width: width/4.1, height: height*0.8, borderWidth: 3, borderRadius: 10, borderColor: Colors.border_color}}>
          <FlatList
            data={reviews.items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ReviewHeader}
            renderItem={({item}) => (
              <View style={{backgroundColor: Colors.card, padding: 10, borderRadius: 5, marginBottom: 20, width: width/4.1 - 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Pressable style={{width: (width/4.1 - 20)/3*2}} onPress={() => Linking.openURL(`/review/${item.id}`)}>
                  <View>
                    <HText style={{fontSize: 20, color: Colors.text_title, fontWeight: '500'}}>{format.sliceText(item.filmTitle, 30)} <HText style={{fontSize: 16, color: Colors.text, fontWeight: '400'}}>{item.filmReleaseYear || ''}</HText></HText>
                    <HText style={{fontSize: 16, color: Colors.text, fontWeight: '400'}}>{format.sliceText(item.text || '', 100)}</HText>
                  </View>
                </Pressable>
                <Pressable style={{flexDirection: 'row', alignItems: 'flex-end'}} onPress={() => handleDelete('review', item.id, () => getReviews(reviews.page))}>
                  <HText style={{fontSize: 20, fontWeight: '600', color: Colors.heteroboxd}}>{item.flags}</HText>
                  <MaterialCommunityIcons name='delete' size={24} color={Colors.text} />
                </Pressable>
              </View>
            )}
            ListFooterComponent={
              <PaginationBar
                page={reviews.page}
                totalPages={Math.ceil(reviews.totalCount / PAGE_SIZE)}
                onPagePress={(num) => { getReviews(num) }}
              />
            }
            ListEmptyComponent={
              servers.reviews.result === 0
              ? <View style={{alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>
              : <HText style={{textAlign: 'center', color: Colors.text, padding: 5, fontSize: 20}}>Nothing to see here.</HText>
            }
            style={{alignSelf: 'center'}}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <View style={{width: width/4.1, height: height*0.8, borderWidth: 3, borderRadius: 10, borderColor: Colors.border_color}}>
          <FlatList
            data={comments.items}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={CommentHeader}
            renderItem={({item}) => (
              <View style={{backgroundColor: Colors.card, padding: 10, borderRadius: 5, marginBottom: 20, width: width/4.1 - 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Pressable style={{width: (width/4.1 - 20)/3*2}} onPress={() => Linking.openURL(`/review/${item.reviewId}`)}>
                  <View style={{alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'row'}}>
                    <UserAvatar
                      pictureUrl={item.authorProfilePictureUrl || null}
                      style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}}
                    />
                    <HText style={{color: Colors.text_title, fontSize: 20, fontWeight: '500'}}>{item.authorName}</HText>
                  </View>
                  <HText style={{color: Colors.text, fontSize: 16, fontWeight: '400'}}>{format.sliceText(item.text || '', 50)}</HText>
                </Pressable>
                <Pressable style={{flexDirection: 'row', alignItems: 'flex-end'}} onPress={() => handleDelete('comment', item.id, () => getComments(comments.page))}>
                  <HText style={{fontSize: 20, fontWeight: '600', color: Colors.heteroboxd}}>{item.flags}</HText>
                  <MaterialCommunityIcons name='delete' size={24} color={Colors.text} />
                </Pressable>
              </View>
            )}
            ListFooterComponent={
              <PaginationBar
                page={comments.page}
                totalPages={Math.ceil(comments.totalCount / PAGE_SIZE)}
                onPagePress={(num) => { getComments(num) }}
              />
            }
            ListEmptyComponent={
              servers.comments.result === 0
              ? <View style={{alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>
              : <HText style={{textAlign: 'center', color: Colors.text, padding: 5, fontSize: 20}}>Nothing to see here.</HText>
            }
            style={{alignSelf: 'center'}}
            showsVerticalScrollIndicator={false}
          />        
        </View>
        <LoadingResponse visible={servers.delete.result === 0} />
        <Snackbar
          visible={[400, 500].includes(servers.delete.result)}
          onDismiss={() => setServers(prev => ({...prev, delete: Response.initial}))}
          duration={3000}
          style={{
            backgroundColor: Colors.card,
            width: '50%',
            alignSelf: 'center',
            borderRadius: 8
          }}
          action={{
            label: 'OK',
            onPress: () => setServers(prev => ({...prev, delete: Response.initial})),
            textColor: Colors.text_link,
          }}
        >
          {servers.delete.message}
        </Snackbar>
      </View>
    </View>
  )
}

export default Admin