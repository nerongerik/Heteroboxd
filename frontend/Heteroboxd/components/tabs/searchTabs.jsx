import { StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, TextInput, useWindowDimensions } from 'react-native'
import { useState, useMemo, useRef } from 'react'
import PaginationBar from '../paginationBar'
import { Poster } from '../poster'
import { Headshot } from '../headshot'
import { Colors } from '../../constants/colors'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import GlowingText from '../glowingText'
import Author from '../author'
import { Fontisto } from '@expo/vector-icons'
import * as format from '../../helpers/format'
import { UserAvatar } from '../userAvatar'
import {BaseUrl} from '../../constants/api'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const PAGE_SIZE = 20

const SearchTabs = ({ widescreen, router, onResponseChange }) => {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(0) //0 - init, 1 - searching, 2 - resting

  const {width} = useWindowDimensions()

  const { searches: history, saveSearch } = useSearchHistory();

  const [results, setResults] = useState({items: [], totalCount: 0, page: 1})

  const [activeTab, setActiveTab] = useState("films")
  const [showPagination, setShowPagination] = useState(false)
  const listRef = useRef(null)

  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const posterWidth = useMemo(() => widescreen ? 150 : 100, [widescreen])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const headshotDim = useMemo(() => widescreen ? 100 : 72, [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 900 : width*0.95), [widescreen])
  const listPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const listPosterHeight = useMemo(() => listPosterWidth * (3 / 2), [listPosterWidth])

  const totalPages = Math.ceil(results.totalCount / PAGE_SIZE);

  const search = async (page, overrides = {}) => {
    const activeQuery = overrides.query ?? query;
    const activeTab_ = overrides.tab ?? activeTab;

    setSearching(1)
    if (page === 1) saveSearch(activeQuery, activeTab_);
    try {
      const res = await fetch(`${BaseUrl.api}/${activeTab_}/search?Search=${activeQuery}&Page=${page}&PageSize=${PAGE_SIZE}`)
      if (res.status === 200) {
        const json = await res.json()
        setResults({items: json.items, totalCount: json.totalCount, page: page})
      }
    } catch {
    } finally {
      setSearching(2)
    }
  }

  const repeatSearch = (s) => {
    setActiveTab(s.tab)
    setQuery(s.query)
    search(1, { query: s.query, tab: s.tab })
  }

  const resetParams = (tab) => {
    setActiveTab(tab)
    setResults({items: [], totalCount: 0, page: 1})
    setQuery('')
    setSearching(0)
  }

  const TabButton = ({ title, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </Pressable>
  );

  const Footer = () => (
    <PaginationBar
      page={results.page}
      totalPages={totalPages}
      visible={showPagination}
      onPagePress={(num) => {
        search(num)
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }}
    />
  );

  const RenderItem = ({item}) => {
    switch (activeTab) {
      case 'films':
        return RenderFilm({item})
      case 'celebrities':
        return RenderCeleb({item})
      case 'lists':
        return RenderList({item})
      case "users":
        return RenderUser({item})
      default:
        onResponseChange(400, 'You cannot search for that.')
        return null
    }
  }

  const RenderFilm = ({item}) => {
    return (
      <>
        <Pressable style={{}} onPress={() => router.push(`/film/${item.filmId}`)}>
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
              <Text style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 20 : 16, color: Colors.text_title, fontWeight: '700'}}>{item.title}</Text>
              {item.originalTitle && item.title !== item.originalTitle && <Text style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 18 : 14, color: Colors.text, fontWeight: '400', fontStyle: 'italic'}}>{item.originalTitle}</Text>}
              <Text style={{fontSize: widescreen ? 16 : 12, color: Colors.text, fontWeight: '400'}}>
                {item.releaseYear > 0 && `${item.releaseYear}`}
                {item.castAndCrew?.length > 0 && item.releaseYear > 0 && ' • '}
                {item.castAndCrew?.map((director, index) => (
                  `${director.celebrityName}${index < item.castAndCrew?.length - 1 ? ', ' : ''}`
                ))}
              </Text>
            </View>
          </View>
        </Pressable>
        <View style={{marginVertical: spacing}} />
      </>
    )
  }

  const RenderCeleb = ({item}) => (
    <>
      <Pressable style={{}} onPress={() => router.push(`/celebrity/${item.celebrityId}`)}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', padding: 3}}>
          <View>
            <Headshot
              pictureUrl={item.celebrityPictureUrl ?? null}
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
            <Text style={{marginBottom: widescreen ? 5 : 2, fontSize: widescreen ? 20 : 16, color: Colors.text, fontWeight: '700'}}>{item.celebrityName}</Text>
          </View>
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  )

  const RenderUser = ({item}) => (
    <>
      <Pressable style={{paddingVertical: 14, lineHeight: 30, paddingHorizontal: 5}} onPress={() => router.push(`/profile/${item.id}`)}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UserAvatar pictureUrl={item.pictureUrl} style={[{width: 30, height: 30, borderRadius: 15, borderColor: Colors.border_color, borderWidth: 1.5}, (item.tier !== 'free' && {marginRight: 10})]} />
          {item.tier === 'free' ? (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <Text style={{ fontSize: 18, marginLeft: 10, color: Colors.text}}>{item.name}</Text>
              {item.patron && <MaterialCommunityIcons style={{paddingLeft: 5}} name="crown" size={18} color={Colors.heteroboxd}/>}
            </View>
          ) : item.tier === 'admin' ? (
            <GlowingText color={Colors._heteroboxd} size={18}>{item.name}</GlowingText>
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <GlowingText color={Colors.heteroboxd} size={18}>{item.name}</GlowingText>
              {item.patron && <MaterialCommunityIcons style={{paddingLeft: 5}} name="crown" size={18} color={Colors.heteroboxd}/>}
            </View>
          )}
        </View>
      </Pressable>
      <View style={{marginVertical: spacing}} />
    </>
  )

  const RenderList = ({item}) => (
    <View style={[{ borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color, borderRadius: 6, backgroundColor: Colors.card, padding: 1}, { marginBottom: spacing }]}>
      <View style={{marginLeft: 5, marginBottom: -5}}>
        <Author
          userId={item.authorId}
          url={item.authorProfilePictureUrl}
          username={item.authorName}
          tier={item.authorTier}
          patron={item.authorPatron}
          router={router}
          widescreen={widescreen}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <Text style={[{color: Colors.text_title, fontWeight: '500', padding: 10}, {fontSize: widescreen ? 22 : 18}]}>{item.name}</Text>
            
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {(() => {
            const paddedFilms = [...item.films].sort((a, b) => a.position - b.position);
            const remainder = paddedFilms.length % 4;
            if (remainder !== 0) {
              const placeholdersToAdd = 4 - remainder;
              for (let i = 0; i < placeholdersToAdd; i++) {
                paddedFilms.push(null);
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
                    borderRadius: 6,
                  }}
                />
              ) : (
                <View
                  key={`placeholder-${i}`}
                  style={{
                    width: listPosterWidth,
                    height: listPosterHeight,
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing/2,
                  }}
                />
              )
            ));
          })()}
        </View>
                
        <Text style={[{color: Colors.text, padding: 10,}, {fontSize: widescreen ? 18 : 14}]}>
          {item.description.slice(0, widescreen ? 500 : 150)}
          {widescreen && item.description.length > 500 && '...'}
          {!widescreen && item.description.length > 150 && '...'}
        </Text>
          
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 6,}}>
          <Fontisto name="nav-icon-list-a" size={widescreen ? 18 : 14} color={Colors._heteroboxd} />
          <Text style={[{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd,}, {color: Colors._heteroboxd, fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.listEntryCount)} </Text>
          <Fontisto name="heart" size={widescreen ? 18 : 14} color={Colors.heteroboxd} />
          <Text style={[{marginHorizontal: 4, fontWeight: 'bold', color: Colors.heteroboxd,}, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.likeCount)}</Text>
        </View>
      </Pressable>
    </View>
  )

  return (
    <>
      <View style={[widescreen ? styles.wideRow : styles.narrowRow]}>
        <TabButton title="Films" active={activeTab === "films"} onPress={() => resetParams("films")} />
        <TabButton title="Celebrities" active={activeTab === "celebrities"} onPress={() => resetParams("celebrities")} />
        <TabButton title="Lists" active={activeTab === "lists"} onPress={() => resetParams("lists")} />
        <TabButton title="Users" active={activeTab === "users"} onPress={() => resetParams("users")} />
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
            placeholder={`Search ${activeTab}...`}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            placeholderTextColor={Colors.text_placeholder}
          />
          <Pressable
            onPress={() => search(1)}
            style={[{backgroundColor: Colors.heteroboxd, padding: 12, borderTopRightRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderLeftWidth: 0, borderColor: Colors.border_color, height: 45 + StyleSheet.hairlineWidth, justifyContent: 'center'}, query.length === 0 && {opacity: 0.8}]}
            disabled={query.length === 0}
          >
            <Fontisto name="search" size={widescreen ? 24 : 18} color={Colors.text_button} />
          </Pressable>
        </View>
        {
          searching !== 0 ? (
            <View style={{width: widescreen ? 100 : null, alignSelf: 'center'}}>
              <Pressable onPress={() => resetParams(activeTab)}><MaterialIcons name="cancel" size={24} color={Colors.text} /></Pressable>
            </View>
          ) : null
        }
      </View>

      {
        searching === 0 ? (
          history.map((s, i) => (
            <View key={i}>
              <Pressable onPress={() => repeatSearch(s)} style={{marginLeft: widescreen ? 40 : 20}}>
                <Text style={{fontSize: widescreen ? 20 : 16, color: Colors.text }}>
                  <Text style={{color: Colors.text_title, opacity: 0.9}}>{s.query}</Text>{' • '}
                  <Text style={{fontWeight: '700', opacity: 0.7}}>{s.tab.toUpperCase()}</Text>{' • '}
                  <Text style={{fontStyle: 'italic', opacity: 0.5}}>{format.formatTimestamp(s.timestamp)}</Text>
                </Text>
              </Pressable>
              <View style={[styles.divider, {marginVertical: 20}]} />
            </View>
          ))
        ) : searching === 1 ? (
          <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator size="large" color={Colors.text_link} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={results.items}
            key={activeTab}
            keyExtractor={(_, index) => `${activeTab}-${index}`}
            renderItem={RenderItem}
            ListEmptyComponent={
              searching === 2 && <Text style={{color: Colors.text, fontSize: 16, textAlign: 'center', padding: 50}}>Nothing to show here.</Text>
            }
            ListFooterComponent={Footer}
            style={{
              width: '100%',
              alignSelf: 'center'
            }}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            onEndReached={() => setShowPagination(true)}
            onEndReachedThreshold={0.2}
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
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
})