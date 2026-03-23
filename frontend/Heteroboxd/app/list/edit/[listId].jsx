import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import Trash from '../../../assets/icons/trash.svg'
import Up from '../../../assets/icons/up.svg'
import Down from '../../../assets/icons/down.svg'
import Check from '../../../assets/icons/check.svg'
import Plus from '../../../assets/icons/plus.svg'
import Trophy from '../../../assets/icons/trophy.svg'
import Trophy2 from '../../../assets/icons/trophy2.svg'
import { Snackbar } from 'react-native-paper'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../../helpers/auth'
import * as format from '../../../helpers/format'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SearchBox from '../../../components/searchBox'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 50

const EditList = () => {
  const { listId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ base, setBase ] = useState(null)
  const [ entries, setEntries ] = useState([])
  const router = useRouter()
  const navigation = useNavigation()
  const { width, height } = useWindowDimensions()
  const [ server, setServer ] = useState(Response.initial)
  const [ snack, setSnack ] = useState({ shown: false, msg: '' })
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const [ searchResults, setSearchResults ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ searchInit, setSearchInit ] = useState(true)
  const [ border1, setBorder1 ] = useState(false)
  const [ border2, setBorder2 ] = useState(false)

  const translateY = slideAnim.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu = useCallback(() => {
    setMenuShown(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }, [slideAnim])
  const closeMenu = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const loadBaseData = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      setBase({})
      return
    }
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/lists?UserListId=${listId}`)
      if (res.ok) {
        const json = await res.json()
        setBase({ id: json.id, listName: json.name || '', desc: json.description || '', ranked: json.ranked || false })
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
        setBase({})
      } else {
        setServer(Response.internalServerError)
        setBase({})
      }
    } catch {
      setServer(Response.networkError)
      setBase({})
    }
  }, [user, listId])

  const loadEntriesData = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/power?UserListId=${listId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setEntries(json)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [listId])

  const handleSubmit = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    setServer(Response.loading)
    try {
      const cler = entries?.map((e, i) => ({
        FilmId: e.filmId,
        Position: i + 1
      }))
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({
          ListId: listId,
          Name: base?.listName,
          Description: base.desc,
          Ranked: base.ranked,
          Entries: cler
        })
      })
      if (res.ok) {
        setServer(Response.ok)
        router.replace(`lists/user/${user.userId}`)
        return
      } else {
        setServer(Response.ok)
        setSnack({ shown: true, msg: `${res.status}: List update failed! Try reloading Heteroboxd.` })
      }
    } catch {
      setServer(Response.ok)
      setSnack({ shown: true, msg: `Network error! Please check your internet connection and try again.` })
    }
  }, [user, listId, entries, base, router])

  const moveItem = useCallback((filmId, direction) => {
    setEntries(prev => {
      const index = prev.findIndex(e => e.filmId === filmId)
      const newArr = [...prev]
      const target = index + direction
      if (target < 0 || target >= newArr.length) return prev
      ;[newArr[index], newArr[target]] = [newArr[target], newArr[index]]
      return newArr
    })
  }, [])

  const deleteItem = useCallback((filmId) => {
    setEntries(prev => prev.filter(e => e.filmId !== filmId))
  }, [])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    if (!base) return
    navigation.setOptions({
      headerTitle: 'Edit list',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={handleSubmit} disabled={base.listName?.length === 0 || entries.length === 0} style={[{marginRight: widescreen ? 15 : null}, (base.listName?.length === 0 || entries.length === 0) && {opacity: 0.5}]}>
          <Check width={24} height={24} />
        </Pressable>
      )
    })
  }, [navigation, widescreen, handleSubmit])

  useEffect(() => {
    if (!base?.id) return
    loadEntriesData()
  }, [base?.id])

  const posterWidth = useMemo(() => widescreen ? 150 : 75, [widescreen])
  const posterHeight = useMemo(() => posterWidth*3/2, [posterWidth])

  const Header = useMemo(() => (
    <>
      <View style={{width: widescreen ? 1000 : width*0.9, alignSelf: 'center'}}>
        <TextInput
          style={[styles.input, {borderColor: border1 ? Colors.heteroboxd : Colors.border_color, marginBottom: 15, fontSize: widescreen ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
          value={base?.listName}
          onChangeText={(newName) => setBase(prev => ({...prev, listName: newName}))}
          placeholderTextColor={Colors.text_placeholder}
          placeholder='List name*'
          onFocus={() => setBorder1(true)}
          onBlur={() => setBorder1(false)}
        />
        <View style={[styles.descWrapper, {marginBottom: 15}]}>
          <TextInput
            style={[styles.input, styles.bioInput, {borderColor: border2 ? Colors.heteroboxd : Colors.border_color, fontSize: widescreen ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
            value={base?.desc}
            onChangeText={(newDesc) => setBase(prev => ({...prev, desc: newDesc}))}
            multiline
            placeholderTextColor={Colors.text_placeholder}
            placeholder='Description (optional)'
            onFocus={() => setBorder2(true)}
            onBlur={() => setBorder2(false)}
          />
          <HText style={[
            styles.counterText,
            { color: base?.desc?.length < 1001 ? Colors.text_title : Colors.password_meager }
          ]}>
            {base?.desc?.length || 0}/1000
          </HText>
        </View>
        <Pressable onPress={() => setBase(prev => ({...prev, ranked: !prev.ranked}))} style={{alignItems: 'center'}}>
          {
            base?.ranked ? (
              <Trophy width={30} height={30} />
            ) : (
              <Trophy2 width={30} height={30} />
            )
          }
          <HText style={{textAlign: 'center', fontSize: 16, color: base?.ranked ? Colors.heteroboxd : Colors.text}}>Ranked</HText>
        </Pressable>
      </View>
    </>
  ), [base, widescreen, width, border1, border2])

  const Render = useCallback(({ item }) => {
    return (
      <View style={{flexDirection: 'row', alignSelf: 'center', alignItems: 'center', width: '100%', justifyContent: 'space-between'}}>
        <View style={[styles.card, {width: widescreen ? '95%' : '90%'}]}>
          <Poster
            posterUrl={item.filmPosterUrl || 'noposter'}
            style={{
              marginRight: 3,
              borderWidth: 2, 
              borderRadius: 4,
              borderColor: Colors.border_color, 
              width: posterWidth, 
              height: posterHeight
            }}
            other={true}
          />
          <View style={{flexShrink: 1, maxWidth: '100%'}}>
            <HText style={{color: Colors.text_title, fontWeight: '600', fontSize: widescreen ? 24 : 16, textAlign: 'center'}}>
              {format.sliceText(item.filmTitle || '', widescreen ? 100 : 30)}
              <HText style={{color: Colors.text, fontWeight: '400', fontSize: widescreen ? 20 : 12}}> {format.parseOutYear(item.filmDate) || ''}</HText>
            </HText>
          </View>
          <View style={{gap: 5, marginLeft: 3}}>
            <Pressable onPress={() => moveItem(item.filmId, -1)}>
              <Up width={28} height={28} />
            </Pressable>
            <Pressable onPress={() => moveItem(item.filmId, +1)}>
              <Down width={28} height={28} />
            </Pressable>
          </View>
        </View>
        <Pressable onPress={() => deleteItem(item.filmId)}>
          <Trash height={20} width={20} />
        </Pressable>
      </View>
    )
  }, [widescreen, posterWidth, posterHeight, entries, moveItem, deleteItem])

  const SearchResult = useCallback(({ item }) => (
    <Pressable onPress={() => {
      if (!entries.some(e => e.filmId === item.id)) setEntries(prev => [...prev, { filmId: item.id, filmPosterUrl: item.posterUrl, filmTitle: item.title, filmDate: item.date }])
      setSearchResults({items: [], totalCount: 0, page: 1})
      setSearchInit(true)
      closeMenu()
    }}>
      <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
        <Poster posterUrl={item.posterUrl || 'noposter'} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} other={true} />
        <View style={{flexShrink: 1, maxWidth: '100%'}}>
          <HText style={{color: Colors.text_title, fontSize: 16}} numberOfLines={3} ellipsizeMode="tail">
            {format.sliceText(item.title || '', widescreen ? 200 : 100)} <HText style={{color: Colors.text, fontSize: 14}}>{format.parseOutYear(item.date) || ''}</HText>
          </HText>
          {
            item.castAndCrew?.length > 0 && (
              <>
                <HText style={{color: Colors.text, fontSize: 12}}>Directed by {
                  item.castAndCrew.map((d, i) => (
                    <HText key={i} style={{}}>
                      {d.name || ''}{i < item.castAndCrew.length - 1 && ', '}
                    </HText>
                  ))
                }</HText>
              </>
            )
          }
        </View>
      </View>
    </Pressable>
  ), [entries, closeMenu, widescreen])

  if (!base) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  return (
    <View style={{backgroundColor: Colors.background, flex: 1, paddingBottom: 50}}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.filmId.toString()}
        extraData={entries}
        ListHeaderComponent={Header}
        renderItem={Render}
        ListEmptyComponent={
          server.result === 0
          ? <View style={{padding: 50, alignItems: 'center'}}><ActivityIndicator size="large" color={Colors.text_link} /></View>
          : <HText style={{textAlign: 'center', color: Colors.text, padding: 50, fontSize: widescreen ? 20 : 16}}>Nothing to see here.</HText>
        }
        contentContainerStyle={{width: widescreen ? 1000 : width*0.9, alignSelf: 'center', gap: 10, paddingBottom: widescreen ? null : 100}}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />
      <Pressable style={styles.fab} onPress={openMenu}>
        <Plus width={24} height={24} />
      </Pressable>

      <Popup
        visible={[403, 404, 500].includes(server.result)}
        message={server.message}
        onClose={() => server.result === 403 ? router.replace('/login') : server.result === 404 ? router.back() : router.replace('/contact')}
      />
      <Snackbar
        visible={snack.shown}
        onDismiss={() => setSnack(prev => ({...prev, shown: false}))}
        duration={3000}
        style={{backgroundColor: Colors.card, width: widescreen ? width*0.5 : width*0.9, alignSelf: 'center', borderRadius: 8}}
        action={{
          label: 'OK',
          onPress: () => setSnack(prev => ({...prev, shown: false})),
          textColor: Colors.text_link
        }}
      >
        {snack.msg}
      </Snackbar>

      <SlidingMenu
        menuShown={menuShown}
        closeMenu={() => {setSearchResults({items: [], totalCount: 0, page: 1}); setSearchInit(true); closeMenu()}}
        translateY={translateY}
        widescreen={widescreen}
        width={width}
      >
        <SearchBox
          onSelected={(res) => {
            setSearchResults(res)
            setSearchInit(false)
          }}
          page={searchResults.page}
          pageSize={PAGE_SIZE}
        />

        <View
          style={[
            styles.entryContainer,
            {
              minHeight: searchInit ? 0 : height/3,
              maxHeight: height/3,
              width: widescreen ? width*0.5 : width*0.95
            }
          ]}
        >
          <FlatList
            data={searchResults.items}
            numColumns={1}
            renderItem={SearchResult}
            ListEmptyComponent={!searchInit && <View style={{width: widescreen ? width*0.5 : width*0.95, alignSelf: 'center'}}><HText style={{padding: 20, textAlign: 'center', color: Colors.text, fontSize: 16}}>We found no records matching your query.</HText></View>}
            contentContainerStyle={{padding: 20, alignItems: 'flex-start', width: '100%'}}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SlidingMenu>
    </View>
  )
}

export default EditList

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 5,
    padding: 10,
    borderWidth: 2,
    borderColor: Colors.border_color,
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 75,
    right: 20,
    zIndex: 999,
    backgroundColor: Colors._heteroboxd,
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, //android
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, //iOS
  },
  descWrapper: {
    marginBottom: 10,
    maxHeight: 80,
    minHeight: 80,
    position: 'relative',
    width: '100%'
  },
  input: {
    backgroundColor: 'transparent',
    borderColor: Colors.border_color,
    borderRadius: 10,
    borderWidth: 1.5,
    color: Colors.text_input,
    height: 45,
    paddingHorizontal: 12,
    width: '100%',
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  bioInput: {
    flex: 1,
    includeFontPadding: false,
    maxHeight: 80,
    minHeight: 80,
    padding: 10,
    textAlignVertical: 'top',
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  counterText: {
    bottom: 6,
    fontSize: 14,
    position: 'absolute',
    right: 8
  },
})