import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Platform, Pressable, StyleSheet, TextInput, useWindowDimensions, Vibration, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, { runOnJS, scrollTo, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated'
import Trash from '../../../assets/icons/trash.svg'
import Up from '../../../assets/icons/up.svg'
import Down from '../../../assets/icons/down.svg'
import Check from '../../../assets/icons/check.svg'
import Plus from '../../../assets/icons/plus.svg'
import Trophy from '../../../assets/icons/trophy.svg'
import Trophy2 from '../../../assets/icons/trophy2.svg'
import { Snackbar } from 'react-native-paper'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import Head from 'expo-router/head'
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PAGE_SIZE = 50
const ITEM_SEPARATOR_HEIGHT = 10
const AUTOSCROLL_EDGE = 70
const AUTOSCROLL_SPEED = 12

const DragHandle = ({ index, item, itemCount, moveItem }) => (
  <View
    accessible
    accessibilityRole='adjustable'
    accessibilityLabel={`Reorder ${item.filmTitle || 'entry'}`}
    accessibilityHint='Long press the entry and drag, or swipe up and down with accessibility controls.'
    accessibilityValue={{text: `Position ${index + 1} of ${itemCount}`}}
    accessibilityActions={[
      {name: 'decrement', label: 'Move up'},
      {name: 'increment', label: 'Move down'},
    ]}
    onAccessibilityAction={({nativeEvent}) => moveItem(item.filmId, nativeEvent.actionName === 'decrement' ? -1 : 1)}
    style={styles.dragHandle}
  >
    <View style={styles.dragHandleBar} />
    <View style={styles.dragHandleBar} />
    <View style={styles.dragHandleBar} />
  </View>
)

const EntryRow = ({ item, widescreen, posterWidth, posterHeight, controls, deleteItem, dragging = false }) => (
  <View style={[styles.row, Platform.OS === 'android' && {height: posterHeight + 24}]}>
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
      {controls}
    </View>
    {dragging ? (
      <View><Trash height={20} width={20} /></View>
    ) : (
      <Pressable onPress={() => deleteItem(item.filmId)}>
        <Trash height={20} width={20} />
      </Pressable>
    )}
  </View>
)

const DraggableEntry = ({ index, item, itemCount, itemPitch, widescreen, posterWidth, posterHeight, deleteItem, moveItem, activeIndex, targetIndex }) => {
  const rowStyle = useAnimatedStyle(() => {
    const from = activeIndex.value
    const to = targetIndex.value
    let translateY = 0
    if (from < to && index > from && index <= to) translateY = -itemPitch
    if (to < from && index >= to && index < from) translateY = itemPitch
    return {
      opacity: index === from ? 0 : 1,
      transform: [{translateY: withTiming(translateY, {duration: 100})}]
    }
  }, [index, itemPitch])

  return (
    <Reanimated.View style={rowStyle}>
      <EntryRow
        item={item}
        widescreen={widescreen}
        posterWidth={posterWidth}
        posterHeight={posterHeight}
        deleteItem={deleteItem}
        controls={
          <DragHandle
            index={index}
            item={item}
            itemCount={itemCount}
            moveItem={moveItem}
          />
        }
      />
    </Reanimated.View>
  )
}

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
  const [ searchResults, setSearchResults ] = useState({ page: 1, items: [], totalCount: 0, loading: false })
  const [ searchInit, setSearchInit ] = useState(true)
  const [ border1, setBorder1 ] = useState(false)
  const [ border2, setBorder2 ] = useState(false)
  const [ activeItem, setActiveItem ] = useState(null)
  const [ headerHeightPx, setHeaderHeightPx ] = useState(0)
  const insets = useSafeAreaInsets()
  const listRef = useAnimatedRef()
  const listContainerRef = useRef(null)
  const activeIndex = useSharedValue(-1)
  const targetIndex = useSharedValue(-1)
  const pointerY = useSharedValue(0)
  const grabOffset = useSharedValue(0)
  const scrollOffset = useSharedValue(0)
  const listTop = useSharedValue(0)
  const viewportHeight = useSharedValue(0)
  const headerHeight = useSharedValue(0)
  const entryCount = useSharedValue(0)
  const widescreen = useMemo(() => width > 1000, [width])
  const posterWidth = useMemo(() => widescreen ? 150 : 75, [widescreen])
  const posterHeight = useMemo(() => posterWidth*3/2, [posterWidth])
  const itemHeight = posterHeight + 24
  const itemPitch = itemHeight + ITEM_SEPARATOR_HEIGHT
  const listBottomPadding = widescreen ? 0 : 100

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
    setServer(Response.loading)
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/lists/power?UserListId=${listId}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setEntries(json)
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [listId])

  const handleSubmit = useCallback(async () => {
    navigation.setOptions({
      headerTitle: null,
      headerLeft: null,
      headerRight: null
    })
    setServer(Response.loading)
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const cler = entries?.map(e => ({ FilmId: e.filmId }))
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
  }, [user, listId, entries, base, router, navigation])

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

  const onDragStart = useCallback((index) => {
    setActiveItem(entries[index])
    Vibration.vibrate(30)
  }, [entries])

  const resetDrag = useCallback(() => {
    activeIndex.value = -1
    targetIndex.value = -1
    setActiveItem(null)
  }, [activeIndex, targetIndex])

  const onDragEnd = useCallback((from, to) => {
    if (from !== to) {
      setEntries(prev => {
        if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    }
    resetDrag()
  }, [resetDrag])

  const listDragGesture = useMemo(() => Gesture.Pan()
    .enabled(Platform.OS === 'android')
    .activateAfterLongPress(180)
    .onTouchesDown((event, stateManager) => {
      const touch = event.allTouches[0]
      if (!touch || headerHeight.value <= 0) {
        stateManager.fail()
        return
      }
      const contentY = scrollOffset.value + touch.absoluteY - listTop.value - headerHeight.value
      const index = Math.floor(contentY / itemPitch)
      const positionInRow = contentY - index * itemPitch
      if (index < 0 || index >= entryCount.value || positionInRow < 0 || positionInRow > itemHeight) stateManager.fail()
    })
    .onStart((event) => {
      const contentY = scrollOffset.value + event.absoluteY - listTop.value - headerHeight.value
      const index = Math.max(0, Math.min(entryCount.value - 1, Math.floor(contentY / itemPitch)))
      const rowTop = listTop.value + headerHeight.value + index * itemPitch - scrollOffset.value
      activeIndex.value = index
      targetIndex.value = index
      pointerY.value = event.absoluteY
      grabOffset.value = event.absoluteY - rowTop
      runOnJS(onDragStart)(index)
    })
    .onUpdate((event) => {
      pointerY.value = event.absoluteY
      const rowTop = scrollOffset.value + event.absoluteY - listTop.value - grabOffset.value - headerHeight.value
      targetIndex.value = Math.max(0, Math.min(entryCount.value - 1, Math.round(rowTop / itemPitch)))
    })
    .onEnd(() => {
      runOnJS(onDragEnd)(activeIndex.value, targetIndex.value)
    })
    .onFinalize((_event, success) => {
      if (!success && activeIndex.value >= 0) runOnJS(resetDrag)()
    }), [itemHeight, itemPitch, activeIndex, targetIndex, pointerY, grabOffset, scrollOffset, listTop, headerHeight, entryCount, onDragStart, onDragEnd, resetDrag])

  const measureList = useCallback(() => {
    listContainerRef.current?.measureInWindow((_x, y, _width, measuredHeight) => {
      listTop.value = y
      viewportHeight.value = measuredHeight
    })
  }, [listTop, viewportHeight])

  const onHeaderLayout = useCallback(({nativeEvent}) => {
    const measuredHeight = nativeEvent.layout.height
    setHeaderHeightPx(measuredHeight)
    headerHeight.value = measuredHeight
  }, [headerHeight])

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollOffset.value = event.contentOffset.y
  })

  useFrameCallback(() => {
    if (activeIndex.value < 0 || viewportHeight.value <= 0) return
    const topEdge = listTop.value + AUTOSCROLL_EDGE
    const bottomEdge = listTop.value + viewportHeight.value - AUTOSCROLL_EDGE
    let delta = 0
    if (pointerY.value < topEdge) delta = -AUTOSCROLL_SPEED * Math.min(1, (topEdge - pointerY.value) / AUTOSCROLL_EDGE)
    if (pointerY.value > bottomEdge) delta = AUTOSCROLL_SPEED * Math.min(1, (pointerY.value - bottomEdge) / AUTOSCROLL_EDGE)
    if (delta === 0) return

    const contentHeight = headerHeight.value + entryCount.value * itemPitch - ITEM_SEPARATOR_HEIGHT + listBottomPadding
    const maxOffset = Math.max(0, contentHeight - viewportHeight.value)
    const nextOffset = Math.max(0, Math.min(maxOffset, scrollOffset.value + delta))
    if (nextOffset === scrollOffset.value) return

    scrollOffset.value = nextOffset
    scrollTo(listRef, 0, nextOffset, false)
    const rowTop = nextOffset + pointerY.value - listTop.value - grabOffset.value - headerHeight.value
    targetIndex.value = Math.max(0, Math.min(entryCount.value - 1, Math.round(rowTop / itemPitch)))
  })

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: activeIndex.value >= 0 ? 1 : 0,
    transform: [{translateY: pointerY.value - listTop.value - grabOffset.value}]
  }))

  useEffect(() => {
    entryCount.value = entries.length
  }, [entries.length, entryCount])

  useEffect(() => {
    loadBaseData()
  }, [loadBaseData])

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

  const Header = useMemo(() => (
      <View onLayout={onHeaderLayout} style={{width: widescreen ? 1000 : width*0.9, alignSelf: 'center', paddingBottom: Platform.OS === 'android' ? ITEM_SEPARATOR_HEIGHT : null}}>
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
  ), [base, widescreen, width, border1, border2, onHeaderLayout])

  const Render = useCallback(({ item, index }) => Platform.OS === 'android' ? (
    <DraggableEntry
      index={index}
      item={item}
      itemCount={entries.length}
      itemPitch={itemPitch}
      widescreen={widescreen}
      posterWidth={posterWidth}
      posterHeight={posterHeight}
      deleteItem={deleteItem}
      moveItem={moveItem}
      activeIndex={activeIndex}
      targetIndex={targetIndex}
    />
  ) : (
    <EntryRow
      item={item}
      widescreen={widescreen}
      posterWidth={posterWidth}
      posterHeight={posterHeight}
      deleteItem={deleteItem}
      controls={
        <View style={{gap: 5, marginLeft: 3}}>
          <Pressable onPress={() => moveItem(item.filmId, -1)}>
            <Up width={28} height={28} />
          </Pressable>
          <Pressable onPress={() => moveItem(item.filmId, +1)}>
            <Down width={28} height={28} />
          </Pressable>
        </View>
      }
    />
  ), [entries.length, itemPitch, widescreen, posterWidth, posterHeight, deleteItem, moveItem, activeIndex, targetIndex])

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

  const getItemLayout = useCallback((_data, index) => ({
    length: itemHeight,
    offset: headerHeightPx + index * itemPitch,
    index
  }), [headerHeightPx, itemHeight, itemPitch])

  if (!base) {
    return (
      <>
      <Head>
        <title>Edit List</title>
        <meta name="description" content="Edit list." />
        <meta property="og:title" content="Edit List" />
        <meta property="og:description" content="Edit list." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
      </Head>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
      </>
    )
  }

  const EntryList = Platform.OS === 'android' ? Reanimated.FlatList : FlatList

  return (
    <>
    <Head>
      <title>Edit {base?.listName}</title>
      <meta name="description" content="Edit list." />
      <meta property="og:title" content={`Edit ${base?.listName}`}/>
      <meta property="og:description" content="Edit list." />
      <meta name="robots" content="noindex, nofollow" />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{backgroundColor: Colors.background, flex: 1, paddingBottom: 50}}>
      <GestureDetector gesture={listDragGesture}>
      <View ref={listContainerRef} collapsable={false} onLayout={measureList} style={{flex: 1}}>
        <EntryList
          ref={Platform.OS === 'android' ? listRef : undefined}
          data={entries}
          keyExtractor={(item) => item.filmId.toString()}
          extraData={entries}
          ListHeaderComponent={Header}
          renderItem={Render}
          ItemSeparatorComponent={Platform.OS === 'android' ? () => <View style={{height: ITEM_SEPARATOR_HEIGHT}} /> : undefined}
          getItemLayout={Platform.OS === 'android' ? getItemLayout : undefined}
          ListEmptyComponent={
            server.result === 0
            ? <View style={{padding: 50, alignItems: 'center'}}><ActivityIndicator size="large" color={Colors.text_link} /></View>
            : <HText style={{textAlign: 'center', color: Colors.text, padding: 50, fontSize: widescreen ? 20 : 16}}>Nothing to see here.</HText>
          }
          contentContainerStyle={{width: widescreen ? 1000 : width*0.9, alignSelf: 'center', gap: Platform.OS === 'android' ? null : 10, paddingBottom: listBottomPadding || null}}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!activeItem}
          onScroll={Platform.OS === 'android' ? scrollHandler : undefined}
          scrollEventThrottle={16}
        />
        {Platform.OS === 'android' && activeItem && (
          <Reanimated.View pointerEvents='none' style={[styles.dragOverlay, {width: widescreen ? 1000 : width*0.9}, overlayStyle]}>
            <EntryRow
              item={activeItem}
              widescreen={widescreen}
              posterWidth={posterWidth}
              posterHeight={posterHeight}
              dragging={true}
              controls={
                <View style={[styles.dragHandle, styles.activeDragHandle]}>
                  <View style={styles.dragHandleBar} />
                  <View style={styles.dragHandleBar} />
                  <View style={styles.dragHandleBar} />
                </View>
              }
            />
          </Reanimated.View>
        )}
      </View>
      </GestureDetector>
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
        height={(Platform.OS === 'web' && widescreen) ? null : height*0.6}
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
              minHeight: (Platform.OS === 'web' && widescreen) ? (height*0.4) : (height*0.6),
              maxHeight: (Platform.OS === 'web' && widescreen) ? (height*0.4) : (height*0.6),
              width: widescreen ? width*0.5 : width*0.95,
              paddingBottom: Platform.OS !== 'web' ? insets.bottom + 50 : null
            }
          ]}
        >
          <FlatList
            data={searchResults.items}
            numColumns={1}
            renderItem={SearchResult}
            ListEmptyComponent={(!searchInit && !searchResults.loading) && <View style={{width: widescreen ? width*0.5 : width*0.95, alignSelf: 'center'}}><HText style={{padding: 20, textAlign: 'center', color: Colors.text, fontSize: 16}}>We found no records matching your query.</HText></View>}
            contentContainerStyle={{padding: 20, alignItems: 'flex-start', width: '100%'}}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SlidingMenu>
    </View>
    </>
  )
}

export default EditList

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between'
  },
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
  dragHandle: {
    width: 34,
    height: 44,
    marginLeft: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  activeDragHandle: {
    opacity: 0.8
  },
  dragHandleBar: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.text
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 1000,
    elevation: 10,
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
