import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import { Fontisto } from '@expo/vector-icons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as format from '../../helpers/format'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import Author from '../author'
import Divider from '../../components/divider'
import { Headshot } from '../headshot'
import HText from '../htext'
import PaginationBar from '../paginationBar'
import { Poster } from '../poster'
import { UserAvatar } from '../userAvatar'

const PAGE_SIZE = 20

const SearchTabs = ({ widescreen, router }) => {
  const [ query, setQuery ] = useState('')
  const [ searching, setSearching ] = useState(0) //0 - init, 1 - searching, 2 - resting
  const { width } = useWindowDimensions()
  const { searches: history, saveSearch } = useSearchHistory()
  const [ results, setResults ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ tab, setTab ] = useState('films')
  const listRef = useRef(null)

  const search = useCallback(async (page, overrides = {}) => {
    const activeQuery = overrides.query || query
    const activeTab = overrides.tab || tab
    setSearching(1)
    if (page === 1) {
      saveSearch(activeQuery, activeTab)
    }
    try {
      const res = await fetch(`${BaseUrl.api}/${activeTab}/search?Search=${activeQuery}&Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.ok) {
        const json = await res.json()
        setResults({ page: json.page, items: json.items, totalCount: json.totalCount })
      }
    } finally {
      setSearching(2)
    }
  }, [query, tab])

  const repeatSearch = useCallback((s) => {
    setTab(s.tab)
    setQuery(s.query)
    search(1, { query: s.query, tab: s.tab })
  }, [search])

  const resetParams = useCallback((tab) => {
    setTab(tab)
    setResults({ page: 1, items: [], totalCount: 0 })
    setQuery('')
    setSearching(0)
  }, [])

  const totalPages = Math.ceil(results.totalCount / PAGE_SIZE)
  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const posterWidth = useMemo(() => widescreen ? 150 : 100, [widescreen])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const headshotDim = useMemo(() => widescreen ? 100 : 72, [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width*0.95), [widescreen])
  const listPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const listPosterHeight = useMemo(() => listPosterWidth * (3 / 2), [listPosterWidth])

  const TabButton = ({ title, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <HText style={[styles.tabText, active && styles.activeTabText]}>{title}</HText>
    </Pressable>
  )

  const Footer = () => (
    <PaginationBar
      page={results.page}
      totalPages={totalPages}
      onPagePress={(num) => {
        search(num)
        listRef.current?.scrollToOffset({
          offset: 0, 
          animated: true 
        })
      }}
    />
  )

  const RenderItem = ({ item }) => {
    switch (tab) {
      case 'films':
        return RenderFilm({ item })
      case 'celebrities':
        return RenderCeleb({ item })
      case 'lists':
        return RenderList({ item })
      case "users":
        return RenderUser({ item })
      default:
        return null
    }
  }

  const RenderFilm = ({ item }) => {
    return (
      <>
        <Pressable onPress={() => router.push(`/film/${item.filmId}`)}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 3}}>
            <View>
              <Poster
                posterUrl={item.posterUrl}
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
            <View>
              <HText style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 20 : 16, color: Colors.text_title, fontWeight: '700'}}>{item.title}</HText>
              {item.originalTitle !== item.title && <HText style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 18 : 14, color: Colors.text, fontWeight: '400', fontStyle: 'italic'}}>{item.originalTitle}</HText>}
              <HText style={{fontSize: widescreen ? 16 : 12, color: Colors.text, fontWeight: '400'}}>
                {item.releaseYear || ''}
                {item.castAndCrew?.length > 0 && item.releaseYear > 0 && ' • '}
                {item.castAndCrew?.map((director, index) => (
                  `${director.celebrityName}${index < item.castAndCrew?.length - 1 ? ', ' : ''}`
                ))}
              </HText>
            </View>
          </View>
        </Pressable>
        <View style={{marginVertical: spacing}} />
      </>
    )
  }

  const RenderCeleb = ({ item }) => (
    <>
      <Pressable onPress={() => router.push(`/celebrity/${item.celebrityId}`)}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 3}}>
          <View>
            <Headshot
              pictureUrl={item.celebrityPictureUrl || null}
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
            <HText style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 20 : 16, color: Colors.text, fontWeight: '700'}}>{item.celebrityName}</HText>
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
          <UserAvatar pictureUrl={item.pictureUrl} style={{width: 30, height: 30, borderRadius: 15, borderColor: Colors.border_color, borderWidth: 1.5}} />
          <HText style={{ fontSize: 18, marginLeft: 10, color: Colors.text}}>{item.name}{item.admin && <HText style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</HText>}</HText>
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  )

  const RenderList = ({ item }) => (
    <View style={{ borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color, borderRadius: 6, backgroundColor: Colors.card, padding: 1, marginBottom: spacing }}>
      <View style={{marginLeft: 5, marginBottom: -5}}>
        <Author
          userId={item.authorId}
          url={item.authorProfilePictureUrl}
          username={item.authorName}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <HText style={[{color: Colors.text_title, fontWeight: '500', padding: 10}, {fontSize: widescreen ? 22 : 18}]}>{item.name}</HText>
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {(() => {
            const paddedFilms = [...item.films].sort((a, b) => a.position - b.position)
            const remainder = paddedFilms.length % 4
            if (remainder !== 0) {
              const placeholdersToAdd = 4 - remainder
              for (let i = 0; i < placeholdersToAdd; i++) {
                paddedFilms.push(null)
              }
            }
            return paddedFilms.map((film, i) => (
              film ? (
                <Poster
                  key={`${item.name}-${film.filmId}-${i}`}
                  posterUrl={film.filmPosterUrl}
                  style={{
                    width: listPosterWidth,
                    height: listPosterHeight,
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing/2,
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
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing/2
                  }}
                />
              )
            ))
          })()}
        </View>
                
        <HText style={[{color: Colors.text, padding: 10,}, {fontSize: widescreen ? 18 : 14}]}>
          {item.description.slice(0, widescreen ? 500 : 150)}
          {widescreen && item.description.length > 500 && '...'}
          {!widescreen && item.description.length > 150 && '...'}
        </HText>
          
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6,}}>
          <Fontisto name='nav-icon-list-a' size={widescreen ? 18 : 14} color={Colors._heteroboxd} />
          <HText style={[{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd,}, {color: Colors._heteroboxd, fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.listEntryCount)} </HText>
          <Fontisto name='heart' size={widescreen ? 18 : 14} color={Colors.heteroboxd} />
          <HText style={[{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd,}, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  )

  return (
    <>
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
              borderColor: Colors.border_color,
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10,
              paddingHorizontal: 12,
              height: 45,
              color: Colors.text_input,
              outlineStyle: 'none',
              outlineWidth: 0,
              outlineColor: 'transparent',
            }}
            placeholder={`Search ${tab}...`}
            value={query}
            onChangeText={setQuery}
            autoCapitalize='none'
            placeholderTextColor={Colors.text_placeholder}
          />
          <Pressable
            onPress={() => search(1)}
            style={[{backgroundColor: Colors.heteroboxd, padding: 12, borderTopRightRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderLeftWidth: 0, borderColor: Colors.border_color, height: 45 + StyleSheet.hairlineWidth, justifyContent: 'center'}, query.length === 0 && {opacity: 0.8}]}
            disabled={query.length === 0}
          >
            <Fontisto name='search' size={widescreen ? 24 : 18} color={Colors.text_button} />
          </Pressable>
        </View>
        {
          searching !== 0 ? (
            <View style={{width: widescreen ? 100 : null, alignSelf: 'center'}}>
              <Pressable onPress={() => resetParams(tab)}><MaterialIcons name="cancel" size={24} color={Colors.text} /></Pressable>
            </View>
          ) : null
        }
      </View>

      {
        searching === 0 ? (
          <ScrollView style={{marginBottom: 30}} showsVerticalScrollIndicator={false}>
            {history.map((s, i) => (
              <View key={i}>
                <Pressable onPress={() => repeatSearch(s)} style={{marginLeft: widescreen ? 40 : 20}}>
                  <HText style={{fontSize: widescreen ? 20 : 16, color: Colors.text }}>
                    <HText style={{color: Colors.text_title, opacity: 0.9}}>{s.query}</HText>{' • '}
                    <HText style={{fontWeight: '700', opacity: 0.7}}>{s.tab.toUpperCase()}</HText>{' • '}
                    <HText style={{fontStyle: 'italic', opacity: 0.5}}>{format.formatTimestamp(s.timestamp)}</HText>
                  </HText>
                </Pressable>
                <Divider marginVertical={20} />
              </View>
            ))}
          </ScrollView>
        ) : searching === 1 ? (
          <View style={{ width: '100%', alignItems: 'center', paddingVertical: 30 }}>
            <ActivityIndicator size='large' color={Colors.text_link} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={results.items}
            key={tab}
            keyExtractor={(_, index) => `${tab}-${index}`}
            renderItem={RenderItem}
            ListEmptyComponent={searching === 2 && <HText style={{color: Colors.text, fontSize: 16, textAlign: 'center', padding: 50}}>Nothing to see here.</HText>}
            ListFooterComponent={Footer}
            style={{width: '100%', alignSelf: 'center'}}
            contentContainerStyle={{paddingBottom: 80}}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          />
        )
      }
    </>
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
  tabText: {
    fontSize: 16,
    color: Colors.text,
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