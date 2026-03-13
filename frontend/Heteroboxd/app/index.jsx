import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Entypo, Fontisto, FontAwesome, FontAwesome6, MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons'
import { Link, useFocusEffect, useNavigation, useRouter } from 'expo-router'
import * as auth from '../helpers/auth'
import * as format from '../helpers/format'
import { useAuth } from '../hooks/useAuth'
import { useTrending } from '../hooks/useTrending'
import { BaseUrl } from '../constants/api'
import { Colors } from '../constants/colors'
import Author from '../components/author'
import Divider from '../components/divider'
import HText from '../components/htext'
import ParsedRead from '../components/parsedRead'
import { Poster } from '../components/poster'
import SideNav from '../components/sideNav'
import Stars from '../components/stars'
import { UserAvatar } from '../components/userAvatar'

const PAGE_SIZE = 10

const Home = () => {
  const { user, isValidSession } = useAuth()
  const { trending } = useTrending()
  const [ popular, setPopular ] = useState([])
  const [ reviews, setReviews ] = useState(null)
  const [ lists, setLists ] = useState(null)
  const [ notifs, setNotifs ] = useState(false)
  const { width } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]
  const [ refreshing, setRefreshing ] = useState(false)
  const [ refreshKey, setRefreshKey ] = useState(0)
  const [dropdownShown, setDropdownShown] = useState(false)
  const [dropdownModalVisible, setDropdownModalVisible] = useState(false)
  const dropdownAnimValue = useRef(new Animated.Value(0)).current
  const dropdownTriggerRef = useRef(null)
  const [dropdownTriggerLayout, setDropdownTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 })

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
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0]
  })
  const openDropdown = () => {
    dropdownTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownTriggerLayout({ x, y, width, height })
      setDropdownModalVisible(true)
      setDropdownShown(true)
      dropdownAnimValue.setValue(0)
      Animated.timing(dropdownAnimValue, { toValue: 1, duration: 180, useNativeDriver: true }).start()
    })
  }
  const closeDropdown = () => {
    Animated.timing(dropdownAnimValue, { toValue: 0, duration: 150, useNativeDriver: true })
      .start(() => { setDropdownModalVisible(false); setDropdownShown(false) })
  }
  const navPress = (path) => {
    setMenuShown(false)
    closeDropdown()
    router.push(path)
  }

  const getPopularFilms = useCallback(async () => {
    try {
      const res = await fetch(`${BaseUrl.api}/films/all?Page=1&PageSize=${PAGE_SIZE}&Filter=ALL&Sort=POPULARITY&Desc=${true}`)
      if (res.ok) {
        const json = await res.json()
        setPopular(json.items)
      } else {
        setPopular([])
        console.log('failed to fetch popular; internal server error.')
      }
    } catch {
      setPopular([])
      console.log('failed to fetch popular; network error.')
    }
  }, [refreshKey])

  const getFriendsActivity = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/friends?Page=1&PageSize=${PAGE_SIZE/2.5}&Sort=${'DATE CREATED'}&Desc=${true}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        const json = await res.json()
        setReviews(json.reviews.items)
        setLists(json.lists.items)
      } else {
        setReviews([])
        setLists([])
        console.log('failed to fetch friends; internal server error.')
      }
    } catch {
      setReviews([])
      setLists([])
      console.log('failed to fetch friends; network error.')
    }
  }, [user, refreshKey])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshKey(prev => prev + 1)
    setTimeout(() => setRefreshing(false), 600)
  }, [])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!user || !(await isValidSession())) {
          return
        }
        try {
          const jwt = await auth.getJwt()
          const res = await fetch(`${BaseUrl.api}/notifications/count`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
          })
          if (res.ok) {
            const json = await res.json()
            setNotifs(json > 0)
          } else {
            console.log('failed to count notifs; internal server error.')
          }
        } catch {
          console.log('failed to count notifs; network error.')
        }
      })()
    }, [user, refreshKey])
  )

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {height: widescreen ? 125 : 75, backgroundColor: Colors.background},
      headerTitle: () => (
          <Image
            source={require('../assets/hboxd.png')}
            style={{width: widescreen ? 250 : 150, height: widescreen ? 125 : 75, resizeMode: 'contain'}}
          />
        ),
      headerTitleAlign: 'center',
      headerRight: () => (
        <Pressable onPress={() => router.push('/search')} style={{marginRight: widescreen ? 15 : null}}>
          <Fontisto name='search' size={24} color={Colors.text} />
        </Pressable>
      ),
      headerLeft: () => {
        if (widescreen) return null
        return (
          <View style={{width: 24, height: 24}}>
            <Pressable onPress={openMenu}>
              <Octicons name='three-bars' size={24} color={Colors.text} />
            </Pressable>
            {notifs && <View style={styles.badge} />}
          </View>
        )
      }
    })
  }, [navigation, user, notifs, widescreen, router, openMenu, refreshKey])

  useEffect(() => {
    getPopularFilms()
    getFriendsActivity()
  }, [getPopularFilms, getFriendsActivity])

  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4.1, [maxRowWidth, spacing])
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth])
  const listSpacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const listMaxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (listMaxRowWidth - listSpacing * 4) / 4, [listMaxRowWidth, listSpacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50, backgroundColor: Colors.background}}>
      {
        !widescreen ? (
          <SideNav
            menuShown={menuShown} 
            closeMenu={closeMenu} 
            translateX={translateX} 
            width={width} 
            footerImage={require('../assets/foreground.png')}
          >
            <View style={{flex: 1, justifyContent: 'flex-start', paddingRight: 10, paddingVertical: 5}}>
              <Pressable onPress={() => navPress(`/films/explore?filter=${'ALL'}&value=${'RELEASE DATE'}`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <MaterialIcons name='explore' size={32} color={Colors.text} />
                </View>
                <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Explore Films</HText>
              </Pressable>
              <Pressable onPress={() => navPress(`/lists/explore?filter=${'ALL'}&value=${'POPULARITY'}`)} style={{marginBottom: user?.userId ? 20 : null, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <FontAwesome6 name='ranking-star' size={24} color={Colors.text} />
                </View>
                <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Popular Lists</HText>
              </Pressable>
              {
                user?.userId && (
                  <>
                    <Pressable onPress={() => navPress(`/reviews/user/${user.userId}`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <MaterialCommunityIcons name='script-text' size={28} color={Colors.text} />
                      </View>
                      <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Your Reviews</HText>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/films/watchlist/${user.userId}`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <MaterialCommunityIcons name='bookmark-plus-outline' size={32} color={Colors.text} />
                      </View>
                      <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Watchlist</HText>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/likes/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <FontAwesome name='heart' size={24} color={Colors.text} />
                      </View>
                      <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Recently Liked</HText>
                    </Pressable>
                  </>
                )
              }

              <Divider marginVertical={20} />

              <Pressable onPress={() => navPress(`/about`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <Entypo name='info-with-circle' size={24} color={Colors.text} />
                </View>
                <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>About</HText>
              </Pressable>
              <Pressable onPress={() => navPress(`/contact`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <Entypo name='old-phone' size={28} color={Colors.text} />
                </View>
                <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Contact</HText>
              </Pressable>
              <Pressable onPress={() => navPress(`/sponsor`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <FontAwesome6 name='circle-dollar-to-slot' size={28} color={Colors.text} />
                </View>
                <HText style={{fontSize: 20, fontWeight: '700', color: Colors.text}}>Donate</HText>
              </Pressable>
              {
                user?.userId ? (
                  <>
                    <Pressable onPress={() => navPress(`/notifications`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <View style={{width: 32, height: 32}}>
                        <MaterialIcons name='notifications' size={32} color={notifs ? Colors.text_title : Colors.text} />
                        {notifs && <View style={[styles.badge, {top: 2, right: 2}]} />}
                      </View>
                      </View>
                      <HText style={{fontSize: 20, fontWeight: notifs ? '700' : '500', color: notifs ? Colors.text_title : Colors.text}}>Notifications</HText>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/profile/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <UserAvatar pictureUrl={user.pictureUrl || null} style={{width: 32, height: 32, borderRadius: 16}} />
                      </View>
                      <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Profile</HText>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => navPress(`/login`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 40, alignItems: 'center'}}>
                    <FontAwesome name='user-circle' size={22} color={Colors.text} />
                    </View>
                    <HText style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Login</HText>
                  </Pressable>
                )
              }
            </View>
          </SideNav>
        ) : (
          <View style={{width: width - 50, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 15, justifyContent: 'center', marginBottom: 15}}>
            <Pressable onPress={() => navPress(`/films/explore?filter=${'ALL'}&value=${'RELEASE DATE'}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 30, alignItems: 'center'}}>
              <MaterialIcons name='explore' size={28} color={Colors.text} />
              </View>
              <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Explore Films</HText>
            </Pressable>
            <Pressable onPress={() => navPress(`/lists/explore?filter=${'ALL'}&value=${'POPULARITY'}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 30, alignItems: 'center'}}>
              <FontAwesome6 name='ranking-star' size={20} color={Colors.text} />
              </View>
              <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Popular Lists</HText>
            </Pressable>
            {
              user?.userId && (
                <>
                  <Pressable onPress={() => navPress(`/reviews/user/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 30, alignItems: 'center'}}>
                    <MaterialCommunityIcons name='script-text' size={24} color={Colors.text} />
                    </View>
                    <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Your Reviews</HText>
                  </Pressable>
                  <Pressable onPress={() => navPress(`/films/watchlist/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 30, alignItems: 'center'}}>
                    <MaterialCommunityIcons name='bookmark-plus-outline' size={28} color={Colors.text} />
                    </View>
                    <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Watchlist</HText>
                  </Pressable>
                  <Pressable onPress={() => navPress(`/likes/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 30, alignItems: 'center'}}>
                    <FontAwesome name='heart' size={20} color={Colors.text} />
                    </View>
                    <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Recently Liked</HText>
                  </Pressable>
                </>
              )
            }
            <Pressable onPress={() => navPress(`/about`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 30, alignItems: 'center'}}>
              <Entypo name='info-with-circle' size={20} color={Colors.text} />
              </View>
              <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>About</HText>
            </Pressable>
            <Pressable onPress={() => navPress(`/contact`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 30, alignItems: 'center'}}>
              <Entypo name='old-phone' size={22} color={Colors.text} />
              </View>
              <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Contact</HText>
            </Pressable>
            <Pressable onPress={() => navPress(`/sponsor`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 30, alignItems: 'center'}}>
              <FontAwesome6 name='circle-dollar-to-slot' size={22} color={Colors.text} />
              </View>
              <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Donate</HText>
            </Pressable>
            {
              user?.userId ? (
                <>
                  <Pressable onPress={() => navPress(`/notifications`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 30, alignItems: 'center'}}>
                    <View style={{width: 24, height: 24}}>
                      <MaterialIcons name='notifications' size={24} color={notifs ? Colors.text_title : Colors.text} />
                      {notifs && <View style={[styles.badge, {top: 1, right: 1}]} />}
                    </View>
                    </View>
                    <HText style={{fontSize: 16, fontWeight: notifs ? '700' : '500', color: notifs ? Colors.text_title : Colors.text}}>Notifications</HText>
                  </Pressable>
                  <Pressable onPress={() => navPress(`/profile/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 30, alignItems: 'center'}}>
                    <UserAvatar pictureUrl={user.pictureUrl || null} style={{width: 28, height: 28, borderRadius: 14}} />
                    </View>
                    <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Profile</HText>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={() => navPress(`/login`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                  <View style={{width: 30, alignItems: 'center'}}>
                  <FontAwesome name='user-circle' size={22} color={Colors.text} />
                  </View>
                  <HText style={{fontSize: 16, fontWeight: '500', color: Colors.text}}>Login</HText>
                </Pressable>
              )
            }
          </View>
        )
      }

      <ScrollView
        contentContainerStyle={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center', marginTop: widescreen ? 35 : null}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <HText style={{color: Colors.text_title, fontSize: widescreen ? 32 : 24, fontWeight: 'bold', textAlign: 'center'}}>What are we watching today, {user?.name || 'stranger'}?</HText>

        <HText style={[styles.regionalTitle, {marginBottom: 10, marginTop: widescreen ? 50 : 30}]}>Trending Globally</HText>
        <View 
          style={{width: colPosterWidth * 4.1 + spacing * 4, maxWidth: '100%', alignSelf: 'center'}}>
          {!trending ? (
            <View style={{width: '100%', alignItems: 'center', paddingVertical: 30}}>
              <ActivityIndicator size='large' color={Colors.text_link} />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{maxWidth: Math.min(width * 0.95, 1000), paddingBottom: 10}}
              contentContainerStyle={{alignItems: 'center'}}
              data={trending}
              keyExtractor={(item) => item.filmId.toString()}
              renderItem={({ item }) => {
                return (
                  <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{marginRight: spacing}}>
                    <Poster
                      posterUrl={item?.filmPosterUrl || null}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: Colors.border_color,
                      }}
                    />
                  </Pressable>
                )
              }}
            />
          )}
        </View>

        <HText style={[styles.regionalTitle, {marginBottom: 10, marginTop: widescreen ? 50 : 30}]}>Popular on Heteroboxd</HText>
        <View style={{width: colPosterWidth * 4.1 + spacing * 4, maxWidth: '100%', alignSelf: 'center'}}>
          {popular.length === 0 ? (
            <View style={{width: '100%', alignItems: 'center', paddingVertical: 30}}>
              <ActivityIndicator size='large' color={Colors.text_link} />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{maxWidth: Math.min(width * 0.95, 1000), paddingBottom: 10}}
              contentContainerStyle={{alignItems: 'center'}}
              data={popular}
              keyExtractor={(item) => item.filmId.toString()}
              renderItem={({ item }) => {
                return (
                  <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{marginRight: spacing}}>
                    <Poster
                      posterUrl={item?.posterUrl || null}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: Colors.border_color,
                      }}
                    />
                  </Pressable>
                )
              }}
            />
          )}
        </View>

        {
          user ? (
            <>
              {(!reviews || !lists) && (
                <>
                  <HText style={[styles.regionalTitle, {marginBottom: 10, marginTop: widescreen ? 50 : 30}]}>New from Friends</HText>
                  <View style={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
                    <View style={{width: '100%', alignItems: 'center', paddingVertical: 30}}>
                      <ActivityIndicator size='large' color={Colors.text_link} />
                    </View>
                  </View>
                </>
              )}
              {reviews && lists && (
                <>
                  {reviews.length === 0 && lists.length === 0 ? (
                    <>
                      <HText style={[styles.regionalTitle, {marginBottom: 10, marginTop: widescreen ? 50 : 30}]}>New from Friends</HText>
                      <View style={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
                        <View style={{ width: '90%', paddingVertical: 30, alignSelf: 'center' }}>
                          <HText style={{textAlign: 'center', fontSize: widescreen ? 20 : 16, color: Colors.text}}>Nothing to see here! Might be time to find some new friends...</HText>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      {reviews.length > 0 && (
                        <>
                          <HText style={[styles.regionalTitle, {marginBottom: 10, marginTop: widescreen ? 50 : 30}]}>Your Friends Watched</HText>
                          <View style={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
                            <View style={{ width: Math.min(width * 0.95, 1000), paddingBottom: 10, alignItems: 'center' }}>
                              {reviews.map((item) => (
                                <View key={item.id.toString()} style={[styles.card, { marginBottom: 10 }]}>
                                  <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Author
                                      userId={item.authorId}
                                      url={item.authorProfilePictureUrl}
                                      username={item.authorName}
                                      admin={item.admin}
                                      router={router}
                                      widescreen={widescreen}
                                    />
                                    <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
                                  </View>
                                  <Pressable onPress={() => router.push(`/review/${item.id}`)}>
                                    <HText style={{ padding: 5, fontWeight: '600', textAlign: 'left', fontSize: widescreen ? 20 : 16, color: Colors.text_title }}>
                                      {item.filmTitle}
                                    </HText>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                                      <View style={{ width: colPosterWidth, height: colPosterHeight, marginRight: 5 }}>
                                        <Poster
                                          posterUrl={item.filmPosterUrl || null}
                                          style={{
                                            width: colPosterWidth,
                                            height: colPosterHeight,
                                            borderWidth: 2,
                                            borderRadius: 6,
                                            borderColor: Colors.border_color
                                          }}
                                        />
                                      </View>
                                      {item.text?.length > 0 ? (
                                        <View style={{ width: maxRowWidth - colPosterWidth - 10, maxHeight: colPosterHeight, overflow: 'hidden' }}>
                                          <ParsedRead html={`${item.text.replace(/\n{2,}/g, '\n').trim().slice(0, 200)}${item.text.length > 200 ? '...' : ''}`} />
                                        </View>
                                      ) : (
                                        <View style={{ width: maxRowWidth - colPosterWidth - 10 }}>
                                          <HText style={{ color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center' }}>
                                            The author was left speechless.
                                          </HText>
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.statsRow}>
                                      <FontAwesome name='heart' size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
                                      <HText style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</HText>
                                    </View>
                                  </Pressable>
                                </View>
                              ))}
                            </View>
                          </View>
                        </>
                      )}
                      {lists.length > 0 && (
                        <>
                          <HText style={[styles.regionalTitle, {marginBottom: 10, marginTop: widescreen ? 50 : 30}]}>New from Friends</HText>
                          <View style={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}>
                            <View style={{width: Math.min(width * 0.95, 1000), paddingBottom: 10, alignItems: 'center'}}>
                              {lists.map((item) => (
                                <View key={item.id.toString()} style={[styles.card, {marginBottom: 10}]}>
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
                                    <HText style={[styles.listTitle, {fontSize: widescreen ? 22 : 18}]}>{item.name}</HText>
                                    <View style={{flexDirection: 'row', justifyContent: 'center'}}>
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
                                                marginRight: i % 4 === 3 ? 0 : widescreen ? listSpacing : listSpacing/2,
                                                borderWidth: 2,
                                                borderColor: Colors.border_color,
                                                borderRadius: 6,
                                              }}
                                            />
                                          ) : (
                                            <View
                                              key={`placeholder-${i}`}
                                              style={{
                                                width: posterWidth,
                                                height: posterHeight,
                                                marginRight: i % 4 === 3 ? 0 : widescreen ? listSpacing : listSpacing/2,
                                              }}
                                            />
                                          )
                                        ))
                                      })()}
                                    </View>
                                    <HText style={[styles.description, {fontSize: widescreen ? 18 : 14}]}>
                                      {item.description?.slice(0, widescreen ? 500 : 150)}
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
                              ))}
                            </View>
                          </View>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <Link href='/login' style={{marginVertical: 50, textAlign: 'center', color: Colors.text, fontWeight: 'bold', fontSize: widescreen ? 24 : 18}}><HText style={{color: Colors.heteroboxd}}>SIGN IN</HText> or <HText style={{color: Colors._heteroboxd}}>JOIN</HText> Heteroboxd for <HText style={{color: Colors.text_title}}>FREE</HText> to track and rate films, write reviews, create lists, interact with other users, and access other members-only features!</Link>
          )
        }

        <HText style={{marginTop: widescreen ? 250 : 100, color: Colors.text, fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>Heteroboxd uses <Link style={{color: Colors.heteroboxd}} href='https://developer.themoviedb.org/docs/getting-started'>tMDB's API</Link> for film data, bearing no endorsement whatsoever.</HText>
      </ScrollView>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  regionalTitle: {
    fontWeight: "500",
    fontSize: 20,
    color: Colors.text_title,
    textAlign: "left",
  },
  card: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border_color,
    borderRadius: 6,
    backgroundColor: Colors.card,
    padding: 5
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  statText: {
    marginHorizontal: 4,
    fontWeight: 'bold',
    color: Colors.heteroboxd,
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
  dropdownBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    minWidth: 220,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  }
})