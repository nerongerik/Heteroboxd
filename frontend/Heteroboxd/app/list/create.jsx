import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Snackbar } from 'react-native-paper'
import { useNavigation, useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import { Poster } from '../../components/poster'
import SearchBox from '../../components/searchBox'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 50

const CreateList = () => {
  const { user, isValidSession } = useAuth()
  const { width, height } = useWindowDimensions()
  const [ listName, setListName ] = useState('')
  const [ desc, setDesc ] = useState('')
  const [ entries, setEntries ] = useState([])
  const [ ranked, setRanked ] = useState(false)
  const router = useRouter()
  const navigation = useNavigation()
  const [ result, setResult ] = useState(-1)
  const [ snack, setSnack ] = useState({ shown: false, msg: '' })
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const [ searchResults, setSearchResults ] = useState({ items: [], totalCount: 0, page: 1 })
  const [ searchInit, setSearchInit ] = useState(true)
  const [ border1, setBorder1 ] = useState(false)
  const [ border2, setBorder2 ] = useState(false)

  const translateY = slideAnim.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu = useCallback(() => {
    setMenuShown(true)
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
    }).start(() => setMenuShown(false));
  }, [slideAnim])

  const handleSubmit = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setSnack({ shown: true, msg: 'Session expired! Try logging in again.' })
      router.replace('/login')
      return
    }
    setResult(0)
    try {
      const payload = entries.map((e, i) => ({
        FilmId: e.filmId,
        Position: i + 1
      }))
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          Name: listName,
          Description: desc,
          Ranked: ranked,
          AuthorId: user.userId,
          Entries: payload
        })
      })
      if (res.ok) {
        setResult(200)
        router.replace(`/lists/user/${user.userId}`)
      } else {
        setSnack({ shown: true, msg: 'Something went wrong! Try reloading Heteroboxd.' })
        setResult(500)
      }
    } catch {
      setSnack({ shown: true, msg: 'Network error! Please check your internet connection and try again.' })
      setResult(500)
    }
  }, [user, listName, desc, ranked, entries])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'New list',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <Pressable onPress={handleSubmit} disabled={listName.length === 0 || entries.length === 0 || desc.length > 1000} style={[{marginRight: widescreen ? 15 : null}, (listName.length === 0 || entries.length === 0 || desc.length > 1000) && {opacity: 0.5}]}>
          <Ionicons name='checkmark' size={24} color={Colors.text_title} />
        </Pressable>
      )
    })
  }, [navigation, widescreen, handleSubmit])

  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 5) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])
  const paddedEntries = useMemo(() => {
    const padded = [...entries]
    const remainder = padded.length % 4
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null)
      }
    }
    return padded
  }, [entries])

  const Header = useMemo(() => (
    <View style={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
      <TextInput
        style={[styles.input, {borderColor: border1 ? Colors.heteroboxd : Colors.border_color, marginBottom: 15, fontSize: widescreen ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
        placeholder="List name*"
        value={listName}
        onChangeText={setListName}
        placeholderTextColor={Colors.text_placeholder}
        onFocus={() => setBorder1(true)}
        onBlur={() => setBorder1(false)}
      />
      <View style={styles.descWrapper}>
        <TextInput
          style={[styles.input, styles.bioInput, {borderColor: border2 ? Colors.heteroboxd : Colors.border_color, fontSize: widescreen ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
          placeholder="Description (optional)"
          value={desc}
          onChangeText={setDesc}
          multiline
          placeholderTextColor={Colors.text_placeholder}
          onFocus={() => setBorder2(true)}
          onBlur={() => setBorder2(false)}
        />
        <HText style={[
          styles.counterText,
          { color: desc.length < 1001 ? Colors.text_title : Colors.password_meager }
        ]}>
          {desc.length}/1000
        </HText>
      </View>
      <View style={{height: widescreen ? 30 : null}} />
      <HText style={{color: Colors.text_title, fontWeight: '700', fontSize: widescreen ? 20 : 18}}> Entries</HText>
      <View style={{height: 15}} />
    </View>
  ), [listName, desc, widescreen, width, border1, border2]);

  const Render = useCallback(({ item, index }) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight}}/>
    }
    return (
      <Pressable key={index} onPress={() => {setEntries(prev => prev.filter((_, i) => i !== index))}} style={{alignItems: 'center'}}>
        <Poster
          posterUrl={item.posterUrl || 'noposter'}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: Colors.border_color,
            marginBottom: ranked ? 0 : spacing
          }}
        />
        {ranked && (
          <View
            style={{
              width: widescreen ? 28 : 20,
              height: widescreen ? 28 : 20,
              borderRadius: 9999,
              backgroundColor: Colors.background,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing / 2,
              marginTop: -10
            }}
          >
            <HText
              style={{
                color: Colors.text_title,
                fontSize: widescreen ? 12 : 8,
                fontWeight: 'bold',
                lineHeight: 18
              }}
            >
              {index + 1}
            </HText>
          </View>
        )}
      </Pressable>
    )
  }, [posterWidth, posterHeight, ranked, spacing, widescreen]);

  const Footer = useMemo(() => (
    <Pressable onPress={() => setRanked(prev => !prev)} style={{alignItems: 'center', marginTop: 5}}>
      <FontAwesome5 name="trophy" size={30} color={ranked ? Colors.heteroboxd : Colors.text} />
      <HText style={{textAlign: 'center', fontSize: 16, color: ranked ? Colors.heteroboxd : Colors.text}}>Ranked</HText>
    </Pressable>
  ), [ranked])

  return (
    <View style={{backgroundColor: Colors.background, flex: 1, justifyContent: 'center'}}>
      <FlatList
        data={paddedEntries}
        numColumns={4}
        ListHeaderComponent={Header}
        renderItem={Render}
        ListEmptyComponent={<HText style={{color: Colors.text, padding: 50, fontSize: widescreen ? 20 : 16}}>This list is empty.</HText>}
        ListFooterComponent={Footer}
        contentContainerStyle={{padding: spacing, alignItems: 'center'}}
        columnWrapperStyle={{columnGap: spacing, rowGap: spacing}}
        showsVerticalScrollIndicator={false}
      />
      <Pressable style={styles.fab} onPress={openMenu}>
        <Ionicons name='add' size={28} color='white' />
      </Pressable>
      
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
        <View style={[
          styles.entryContainer,
          {
            minHeight: searchInit ? 0 : height/3,
            maxHeight: height/3,
            width: widescreen ? width*0.5 : width*0.95
          }
        ]}>
          <FlatList
            data={searchResults.items}
            numColumns={1}
            renderItem={({item}) => (
              <Pressable onPress={() => {
                if (!entries.some(e => e.filmId === item.id)) setEntries(prev => [...prev, { filmId: item.id, posterUrl: item.posterUrl }])
                setSearchResults({items: [], totalCount: 0, page: 1})
                setSearchInit(true)
                closeMenu()
              }}>
                <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
                  <Poster posterUrl={item.posterUrl || 'noposter'} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} />
                  <View style={{flexShrink: 1, maxWidth: '100%'}}>
                    <HText style={{color: Colors.text_title, fontSize: 16}} numberOfLines={3} ellipsizeMode="tail">
                      {format.sliceText(item.title || '', widescreen ? -1 : 100)} <HText style={{color: Colors.text, fontSize: 14}}>{format.parseOutYear(item.date) || ''}</HText>
                    </HText>
                    <HText style={{color: Colors.text, fontSize: 12}}>Directed by {
                      item.castAndCrew?.map((d, i) => (
                        <HText key={i} style={{}}>
                          {d.name || ''}{i < item.castAndCrew?.length - 1 && ", "}
                        </HText>
                      ))
                    }</HText>
                  </View>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              !searchInit && <View style={{width: widescreen ? width*0.5 : width*0.95, alignSelf: 'center'}}><HText style={{padding: 20, textAlign: 'center', color: Colors.text, fontSize: 16}}>We found no records matching your query.</HText></View>
            }
            contentContainerStyle={{padding: 20, alignItems: 'flex-start', width: '100%'}}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SlidingMenu>

      <LoadingResponse visible={result === 0} />
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

    </View>
  )
}

export default CreateList


const styles = StyleSheet.create({
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
  entryContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderColor: Colors.border_color,
    overflow: 'hidden'
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
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
