import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign'
import Fontisto from '@expo/vector-icons/Fontisto'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as format from '../../../helpers/format'
import { useAuth } from '../../../hooks/useAuth'
import { BaseUrl } from '../../../constants/api'
import { Colors } from '../../../constants/colors'
import { Response } from '../../../constants/response'
import Author from '../../../components/author'
import FilterSort from '../../../components/filterSort'
import HText from '../../../components/htext'
import LoadingResponse from '../../../components/loadingResponse'
import PaginationBar from '../../../components/paginationBar'
import Popup from '../../../components/popup'
import { Poster } from '../../../components/poster'
import SlidingMenu from '../../../components/slidingMenu'

const PAGE_SIZE = 20

const UsersLists = () => {

  const { userId } = useLocalSearchParams()
  const { user } = useAuth()
  const [ author, setAuthor ] = useState({ username: '', avatar: '', admin: false })
  const navigation = useNavigation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const [ data, setData ] = useState({ page: 1, lists: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const [ currentFilter, setCurrentFilter ] = useState({ field: 'ALL', value: null })
  const [ currentSort, setCurrentSort ] = useState({ field: 'DATE CREATED', desc: true })
  const listRef = useRef(null)
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]

  const openMenu = () => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setMenuShown(false))
  }
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  })

  const loadDataPage = useCallback(async (page) => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/lists/user?UserId=${userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${currentFilter.field}&Sort=${currentSort.field}&Desc=${currentSort.desc}&FilterValue=${encodeURIComponent(currentFilter.value || '')}`)
      if (res.ok) {
        const json = await res.json()
        setData({ page: json.page, lists: json.items, totalCount: json.totalCount })
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId, currentFilter, currentSort])

  useEffect(() => {
    loadDataPage(1)
  }, [loadDataPage])

  useEffect(() => {
    const first = data.lists[0]
    if (!first) return
    setAuthor({ username: first.authorName, avatar: first.authorProfilePictureUrl, admin: first.admin })
  }, [data.lists])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: author.username?.length > 0 ? `${author.username}'s lists` : '',
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title, fontFamily: 'Inter_400Regular'},
      headerRight: () => (
        <>
          {
            user?.userId === userId && (
              <Pressable onPress={() => router.push('/list/create')}>
                <AntDesign name='plus' size={24} color={Colors.text_title} />
              </Pressable>
            )
          }
          <Pressable onPress={openMenu} style={{marginRight: widescreen ? 15 : null, marginLeft: user?.userId === userId ? 15 : null}}>
            <Ionicons name='options' size={24} color={Colors.text} />
          </Pressable>
        </>
      )
    })
  }, [user, userId, author, navigation, router, widescreen, openMenu])

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE)
  const spacing = useMemo(() => widescreen ? 30 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 800 : width * 0.9, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])
  const AuthorSection = useMemo(() =>
    <View style={{marginLeft: 5, marginBottom: -5}}>
      <Author
        userId={userId}
        url={author.avatar}
        username={author.username}
        admin={author.admin}
        router={router}
        widescreen={widescreen}
      />
    </View>,
  [userId, author, widescreen, router])

  const List = ({ item }) => (
    <View style={[styles.card, { marginBottom: spacing * 1.25 }]}>
      {AuthorSection}
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <HText style={[styles.listTitle, {fontSize: widescreen ? 22 : 18}]}>{item.name}</HText>
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
                  key={film.filmId}
                  posterUrl={film.filmPosterUrl}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
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
                    width: posterWidth,
                    height: posterHeight,
                    marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2
                  }}
                />
              )
            ))
          })()}
        </View>
        <HText style={[styles.description, {fontSize: widescreen ? 18 : 14}]}>
          {item.description.slice(0, widescreen ? 500 : 150)}
          {widescreen && item.description.length > 500 && '...'}
          {!widescreen && item.description.length > 150 && '...'}
        </HText>
        <View style={styles.statsRow}>
          <Fontisto name='nav-icon-list-a' size={widescreen ? 18 : 14} color={Colors._heteroboxd} />
          <HText style={[styles.statText, {color: Colors._heteroboxd, fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.listEntryCount)} </HText>
          <Fontisto name='heart' size={widescreen ? 18 : 14} color={Colors.heteroboxd} />
          <HText style={[styles.statText, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  )

  const Footer = () => (
    <PaginationBar
      page={data.page}
      totalPages={totalPages}
      onPagePress={(num) => {
        loadDataPage(num)
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        })
      }}
    />
  )

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, paddingBottom: 50}}>
      <FlatList
        ref={listRef}
        data={data.lists}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={server.result > 0 && <HText style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center', padding: 35}}>Nothing to see here.</HText>}
        renderItem={List}
        ListFooterComponent={Footer}
        contentContainerStyle={{width: maxRowWidth, paddingBottom: 80, marginTop: 40, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
      />

      <LoadingResponse visible={server.result <= 0} />
      <Popup
        visible={[404, 500].includes(server.result)}
        message={server.message}
        onClose={() => server.result === 404 ? router.back() : router.replace('/contact')}
      />

      <SlidingMenu
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY} 
        widescreen={widescreen} 
        width={width}
      >
        <FilterSort
          key={`${currentFilter.field}-${currentSort.field}`}
          context={'userLists'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {setCurrentFilter(newFilter); closeMenu()}}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  )
}

export default UsersLists

const styles = StyleSheet.create({
  card: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.border_color,
    borderRadius: 6,
    backgroundColor: Colors.card,
    padding: 1
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingBottom: 0
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.border_color,
    marginRight: 6,
  },
  listTitle: {
    color: Colors.text_title,
    fontWeight: '500',
    padding: 10,
  },
  description: {
    color: Colors.text,
    padding: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statText: {
    marginHorizontal: 4,
    fontWeight: 'bold',
    color: Colors.heteroboxd,
  }
})