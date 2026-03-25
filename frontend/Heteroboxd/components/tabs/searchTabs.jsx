import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, PanResponder, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import ListIco from '../../assets/icons/list.svg'
import Heart from '../../assets/icons/heart.svg'
import Search from '../../assets/icons/search.svg'
import X from '../../assets/icons/x.svg'
import * as format from '../../helpers/format'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import Author from '../author'
import Divider from '../../components/divider'
import { Headshot } from '../headshot'
import HText from '../htext'
import { Poster } from '../poster'
import { UserAvatar } from '../userAvatar'

const PAGE_SIZE = 20
const TABS = ['films', 'celebrities', 'lists', 'users']

const SearchTabs = ({ widescreen, router }) => {
  const [ query, setQuery ] = useState('')
  const queryRef = useRef('')
  const { width } = useWindowDimensions()
  const { searches: history, saveSearch } = useSearchHistory()
  const [ showHistory, setShowHistory ] = useState(true)
  const [ results, setResults ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ tab, setTab ] = useState('films')
  const [ border, setBorder ] = useState(false)
  const listRef = useRef(null)
  const requestRef = useRef(0)
  const [ loading, setLoading ] = useState(false)
  const loadingRef = useRef(false)

  const search = useCallback(async (page, overrides = {}) => {
    const activeQuery = overrides.query || queryRef.current
    const activeTab = overrides.tab || tab
    if (loadingRef.current) return
    const requestId = ++requestRef.current
    loadingRef.current = true
    setShowHistory(false)
    setLoading(true)
    if (page === 1) saveSearch(activeQuery, activeTab)
    try {
      const res = await fetch(`${BaseUrl.api}/${activeTab}/search?Search=${activeQuery}&Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setResults({ page: json.page, items: json.items, totalCount: json.totalCount })
        } else {
          setResults(prev => ({...prev, page: json.page, items: prev.items.length > 1000 ? [...prev.items.slice(-980), ...json.items] : [...prev.items, ...json.items]}))
        }
      }
      setLoading(false)
      loadingRef.current = false
    } catch {
      setLoading(false)
      loadingRef.current = false
    }
  }, [tab, saveSearch])

  const totalPages = useMemo(() => Math.ceil(results.totalCount / PAGE_SIZE), [results.totalCount])

  const loadNextPage = useCallback(() => {
    if (results.page < totalPages) {
      search(results.page + 1)
    }
  }, [results.page, totalPages, search])

  const repeatSearch = useCallback((s) => {
    setTab(s.tab)
    setQuery(s.query)
    queryRef.current = s.query
    search(1, { query: s.query, tab: s.tab })
  }, [search])

  const resetParams = useCallback((tab) => {
    setTab(tab)
    setResults({ page: 1, items: [], totalCount: 0 })
    setQuery('')
    queryRef.current = ''
    setShowHistory(true)
  }, [])

  const panResponder = useMemo(() => {
    if (widescreen) return null
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2,
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 50) return
        const currentIndex = TABS.indexOf(tab)
        if (dx < 0 && currentIndex < TABS.length - 1) {
          resetParams(TABS[currentIndex + 1])
        } else if (dx > 0 && currentIndex > 0) {
          resetParams(TABS[currentIndex - 1])
        }
      }
    })
  }, [widescreen, tab, resetParams])

  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const posterWidth = useMemo(() => widescreen ? 150 : 100, [widescreen])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const headshotDim = useMemo(() => widescreen ? 100 : 72, [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])
  const listPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const listPosterHeight = useMemo(() => listPosterWidth * (3 / 2), [listPosterWidth])

  const TabButton = useCallback(({ title, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <HText style={[{fontSize: width > 1000 ? 16 : width > 300 ? 14 : 12, color: Colors.text}, active && styles.activeTabText]}>{title}</HText>
    </Pressable>
  ), [])

  const Footer = useMemo(() => (results.items.length > 0 && loading) ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [results.items.length, loading])

  const RenderItem = useCallback(({ item }) => {
    switch (tab) {
      case 'films': return RenderFilm({ item })
      case 'celebrities': return RenderCeleb({ item })
      case 'lists': return RenderList({ item })
      case 'users': return RenderUser({ item })
      default: return null
    }
  }, [tab])

  const RenderFilm = ({ item }) => (
    <>
      <Pressable onPress={() => router.push(`/film/${item.id}`)}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 3}}>
          <View>
            <Poster
              posterUrl={item.posterUrl || 'noposter'}
              style={{
                width: posterWidth,
                height: posterHeight,
                borderColor: Colors.border_color,
                borderWidth: 2,
                borderRadius: 5,
                marginRight: widescreen ? 10 : 5
              }}
            />
          </View>
          <View style={{flexShrink: 1, maxWidth: '100%'}}>
            <HText style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 20 : 16, color: Colors.text_title, fontWeight: '700'}}>
              {format.sliceText(item.title || '', widescreen ? -1 : 100)}
            </HText>
            {item.originalTitle && (
              <HText style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 18 : 14, color: Colors.text, fontWeight: '400', fontStyle: 'italic'}}>
                {item.originalTitle}
              </HText>
            )}
            <HText style={{fontSize: widescreen ? 16 : 12, color: Colors.text, fontWeight: '400'}}>
              {format.parseOutYear(item.date)}
              {item.castAndCrew?.length > 0 && format.parseOutYear(item.date).length > 0 && ' • '}
              {item.castAndCrew?.map((director, index) => (
                `${director.name}${index < item.castAndCrew?.length - 1 ? ', ' : ''}`
              ))}
            </HText>
          </View>
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  )

  const RenderCeleb = ({ item }) => (
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
          </View>
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  )

  const RenderUser = ({ item }) => (
    <>
      <Pressable style={{paddingVertical: 14, lineHeight: 30, paddingHorizontal: 5}} onPress={() => router.push(`/profile/${item.id}`)}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <UserAvatar
            pictureUrl={item.pictureUrl}
            style={{width: widescreen ? 50 : 30, height: widescreen ? 50 : 30, borderRadius: widescreen ? 25 : 15, borderColor: Colors.border_color, borderWidth: 1.5}}
          />
          <HText style={{fontSize: widescreen ? 22 : 18, marginLeft: 10, color: Colors.text}}>
            {item.name}
            {item.admin && <HText style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</HText>}
          </HText>
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  )

  const RenderList = ({ item }) => (
    <View style={{borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color, borderRadius: 6, backgroundColor: Colors.card, padding: 1, marginBottom: 5}}>
      <View style={{marginLeft: 5, marginBottom: -5}}>
        <Author
          userId={item.authorId}
          url={item.authorPictureUrl || null}
          username={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
          dim={widescreen ? 40 : 30}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <HText style={{color: Colors.text_title, fontWeight: '500', padding: 10, fontSize: widescreen ? 20 : 16}}>
          {format.sliceText(item.name || '', widescreen ? 80 : 40)}
        </HText>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          {item.films.map((film, i) => (
            film ? (
              <Poster
                key={`${item.name}-${film.filmId}-${i}`}
                posterUrl={film.filmPosterUrl || 'noposter'}
                style={{
                  width: listPosterWidth,
                  height: listPosterHeight,
                  marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                  borderRadius: 6
                }}
              />
            ) : (
              <View
                key={`placeholder-${i}`}
                style={{
                  width: listPosterWidth,
                  height: listPosterHeight,
                  marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2
                }}
              />
            )
          ))}
        </View>
        <HText style={{color: Colors.text, padding: 10, fontSize: widescreen ? 16 : 14}}>
          {format.sliceText(item.description || '', widescreen ? 500 : 150)}
        </HText>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6}}>
          <ListIco height={widescreen ? 20 : 16} width={widescreen ? 20 : 16} />
          <HText style={{marginHorizontal: 4, fontWeight: 'bold', color: Colors._heteroboxd, fontSize: widescreen ? 16 : 12}}>{format.formatCount(item.listEntryCount)} </HText>
          <Heart height={widescreen ? 16 : 12} width={widescreen ? 16 : 12} fill={Colors.heteroboxd} />
          <HText style={{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd, fontSize: widescreen ? 16 : 12}}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  )

  return (
    <View style={{flex: 1}} {...(panResponder?.panHandlers ?? {})}>
      <View style={widescreen ? styles.wideRow : styles.narrowRow}>
        <TabButton title='Films' active={tab === 'films'} onPress={() => resetParams('films')} />
        <TabButton title='Celebrities' active={tab === 'celebrities'} onPress={() => resetParams('celebrities')} />
        <TabButton title='Lists' active={tab === 'lists'} onPress={() => resetParams('lists')} />
        <TabButton title='Users' active={tab === 'users'} onPress={() => resetParams('users')} />
      </View>

      <View style={{width: widescreen ? 1000 : null, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30, alignSelf: 'center', paddingHorizontal: 5}}>
        <View style={{width: widescreen ? 900 : '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <TextInput
            style={{
              minWidth: widescreen ? 800 : '80%',
              maxWidth: widescreen ? 800 : '80%',
              borderWidth: 1.5,
              borderRightWidth: 0,
              borderColor: border ? Colors.heteroboxd : Colors.border_color,
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10,
              paddingHorizontal: 12,
              height: 45,
              color: Colors.text_input,
              outlineStyle: 'none',
              outlineWidth: 0,
              outlineColor: 'transparent',
              fontFamily: 'Inter_400Regular'
            }}
            placeholder={`Search ${tab}...`}
            value={query}
            onChangeText={(text) => {setQuery(text); queryRef.current = text}}
            autoCapitalize='none'
            placeholderTextColor={Colors.text_placeholder}
            onFocus={() => setBorder(true)}
            onBlur={() => setBorder(false)}
            onSubmitEditing={() => {
              if (query.length > 0) search(1)
            }}
          />
          <Pressable
            onPress={() => search(1)}
            style={[{alignItems: 'center', alignContent: 'center', backgroundColor: Colors.heteroboxd, padding: 12, borderTopRightRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderLeftWidth: 0, borderColor: border ? Colors.heteroboxd : Colors.border_color, height: 45, justifyContent: 'center'}, query.length === 0 && {opacity: 0.8}]}
            disabled={query.length === 0}
          >
            <Search width={widescreen ? 24 : 18} height={widescreen ? 24 : 18} fill={Colors.text_button} />
          </Pressable>
        </View>
        {!showHistory && (
          <View style={{width: widescreen ? 100 : null, alignSelf: 'center'}}>
            <Pressable onPress={() => resetParams(tab)}>
              <X width={24} height={24} />
            </Pressable>
          </View>
        )}
      </View>

      {showHistory ? (
        <ScrollView style={{marginBottom: 30}} showsVerticalScrollIndicator={false}>
          {history.map((s, i) => (
            <View key={i}>
              <Pressable onPress={() => repeatSearch(s)} style={{marginLeft: widescreen ? 40 : 20}}>
                <HText style={{fontSize: widescreen ? 18 : 16, color: Colors.text}}>
                  <HText style={{color: Colors.text_title, opacity: 0.9}}>{s.query}</HText>{' • '}
                  <HText style={{fontWeight: '700', opacity: 0.7}}>{s.tab.toUpperCase()}</HText>{' • '}
                  <HText style={{fontStyle: 'italic', opacity: 0.5}}>{format.formatTimestamp(s.timestamp)}</HText>
                </HText>
              </Pressable>
              <Divider marginVertical={20} />
            </View>
          ))}
        </ScrollView>
      ) : results.items.length === 0 && loading ? (
        <View style={{width: '100%', alignItems: 'center', paddingVertical: 30}}>
          <ActivityIndicator size='large' color={Colors.text_link} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={results.items}
          key={tab}
          keyExtractor={(_, index) => `${tab}-${index}`}
          renderItem={RenderItem}
          ListEmptyComponent={!loading && <HText style={{color: Colors.text, fontSize: 16, textAlign: 'center', padding: 50}}>Nothing to see here.</HText>}
          ListFooterComponent={Footer}
          style={{width: '100%', alignSelf: 'center'}}
          contentContainerStyle={{paddingBottom: 80}}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          onEndReachedThreshold={0.2}
          onEndReached={loadNextPage}
        />
      )}
    </View>
  )
}

export default SearchTabs

const styles = StyleSheet.create({
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    flex: 1,
  },
  activeTabText: {
    color: Colors.text_title,
    fontWeight: "bold",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: Colors.heteroboxd,
  },
  narrowRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: "space-between",
    width: '100%',
    marginBottom: 20,
  },
  wideRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
  }
})