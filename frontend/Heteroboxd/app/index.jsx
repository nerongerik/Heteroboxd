import { useNavigation, useRouter, useFocusEffect, Link } from 'expo-router'
import { RefreshControl, StyleSheet, Text, useWindowDimensions, View, Pressable, ScrollView, Image, Animated, Linking, ActivityIndicator, FlatList } from 'react-native'
import { Colors } from '../constants/colors'
import { useAuth } from '../hooks/useAuth';
import { useTrending } from '../hooks/useTrending';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Fontisto } from '@expo/vector-icons';
import { Octicons } from '@expo/vector-icons';
import SideNav from '../components/sideNav';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';
import { UserAvatar } from '../components/userAvatar'
import { FontAwesome } from '@expo/vector-icons';
import * as auth from '../helpers/auth'
import { BaseUrl } from '../constants/api';
import Popup from '../components/popup';
import Dropdown from '../components/dropdown';
import { Poster } from '../components/poster';
import Author from '../components/author';
import Stars from '../components/stars';
import ParsedRead from '../components/parsedRead';
import * as format from '../helpers/format'

const PAGE_SIZE = 10

const Home = () => {
  const { user, isValidSession } = useAuth()

  const { trending } = useTrending()
  const [popular, setPopular] = useState([])
  const [reviews, setReviews] = useState(null)
  const [lists, setLists] = useState(null)
  const [notifs, setNotifs] = useState(false)

  const { width } = useWindowDimensions()

  const router = useRouter()
  const navigation = useNavigation()

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0]; //sliding animation prep
  const dropdownRef = useRef(null)

  const [message, setMessage] = useState('')
  const [result, setResult] = useState(-1)

  const [refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshKey(k => k + 1)
    setTimeout(() => setRefreshing(false), 600)
  }, [])

  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4.1, [maxRowWidth, spacing]);
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth]); //maintain 2:3 aspect
  const listSpacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const listMaxRowWidth = useMemo(() => (widescreen ? 900 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (listMaxRowWidth - listSpacing * 4) / 4, [listMaxRowWidth, listSpacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  useFocusEffect(
    useCallback(() => {
      if (!user) return
      (async () => {
        const vS = await isValidSession()
        if (!vS) return
        setResult(0)
        try {
          const jwt = await auth.getJwt()
          const res = await fetch(`${BaseUrl.api}/notifications/count/${user.userId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${jwt}`
            }
          })
          if (res.status === 200) {
            const json = await res.json()
            setNotifs(json > 0)
            setResult(200)
          } else {
            console.log(`${res.status}: failed to count notifications.`)
            setResult(res.status)
          }
        } catch {
          setMessage("Network error - Please check your internet connection!")
          setResult(500)
        }
      })()
    }, [user, refreshKey])
  )

  useEffect(() => {
    navigation.setOptions({
      headerStyle: { height: widescreen ? 125 : 75, backgroundColor: Colors.background },
      headerTitle: () => (
          <Image
            source={require('../assets/hboxd.png')}
            style={{ width: widescreen ? 250 : 150, height: widescreen ? 125 : 75, resizeMode: 'contain' }}
          />
        ),
      headerTitleAlign: 'center',
      headerRight: () => (
        <Pressable onPress={() => router.push('/search')} style={{marginRight: widescreen ? 15 : null}}>
          <Fontisto name="search" size={widescreen ? 28 : 24} color={Colors.text} />
        </Pressable>
      ),
      headerLeft: () => {
        if (widescreen) return null
        return (
          <View style={{width: 24, height: 24}}>
            <Pressable onPress={openMenu}>
              <Octicons name="three-bars" size={24} color={Colors.text} />
            </Pressable>
            {notifs && <View style={styles.badge} />}
          </View>
        )
      }
    });
  }, [user, notifs, widescreen, router, refreshKey])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/films?Page=1&PageSize=${PAGE_SIZE}&Filter=ALL&Sort=POPULARITY&Desc=${true}`, {
          method: 'GET',
          headers: {'Accept': 'application/json'}
        })
        if (res.status === 200) {
          const json = await res.json()
          setPopular(json.items)
        } else {
          setMessage('Something went wrong! Try reloading Heteroboxd.')
          setResult(500)
        }
      } catch {
        setMessage('Network error! Please check your internet connection.')
        setResult(500)
      }
    })()
  }, [refreshKey])

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/reviews?UserId=${user.userId}&Page=1&PageSize=${PAGE_SIZE/2.5}&Filter=FRIENDS&Sort=${'DATE CREATED'}&Desc=${true}`, {
          method: 'GET',
          headers: {'Accept': 'application/json'}
        })
        if (res.status === 200) {
          const json = await res.json()
          setReviews(json.items)
        } else {
          setMessage('Something went wrong! Try reloading Heteroboxd.')
          setResult(500)
        }
      } catch {
        setMessage('Network error! Please check your internet connection.')
        setResult(500)
      }
    })()
  }, [refreshKey])

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/lists?UserId=${user.userId}&Page=1&PageSize=${PAGE_SIZE/2.5}&Filter=FRIENDS&Sort=${'DATE CREATED'}&Desc=${true}`, {
          method: 'GET',
          headers: {'Accept': 'application/json'}
        })
        if (res.status === 200) {
          const json = await res.json()
          setLists(json.items)
        } else {
          setMessage('Something went wrong! Try reloading Heteroboxd.')
          setResult(500)
        }
      } catch {
        setMessage('Network error! Please check your internet connection.')
        setResult(500)
      }
    })()
  }, [refreshKey])

  const openMenu = () => {
    setMenuShown(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false));
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0], //slide from left
  });

  const navPress = useCallback((path) => {
    setMenuShown(false)
    dropdownRef.current?.close()
    if (path === '/about') Linking.openURL(`https://www.heteroboxd.com${path}`)
    else router.push(path)
  }, [router])

  const DropdownChildren = useMemo(() =>
    <>
      <Pressable onPress={() => navPress(`/about`)} style={{marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
        <View style={{width: 40, alignItems: 'center'}}>
        <Entypo name="info-with-circle" size={24} color={Colors.text} />
        </View>
        <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>About</Text>
      </Pressable>
      <Pressable onPress={() => navPress(`/contact`)} style={{marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
        <View style={{width: 40, alignItems: 'center'}}>
        <Entypo name="old-phone" size={28} color={Colors.text} />
        </View>
        <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Contact</Text>
      </Pressable>
      <Pressable onPress={() => navPress(`/sponsor`)} style={{marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
        <View style={{width: 40, alignItems: 'center'}}>
        <FontAwesome6 name="circle-dollar-to-slot" size={28} color={Colors.text} />
        </View>
        <Text style={{fontSize: 20, fontWeight: '700', color: Colors.text}}>Donate</Text>
      </Pressable>
      {
        user?.userId ? (
          <>
            <Pressable onPress={() => navPress(`/notifications`)} style={{marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 40, alignItems: 'center'}}>
              <View style={{width: 32, height: 32}}>
                <MaterialIcons name="notifications" size={32} color={notifs ? Colors.text_title : Colors.text} />
                {notifs && <View style={[styles.badge, {top: 2, right: 2}]} />}
              </View>
              </View>
              <Text style={{fontSize: 20, fontWeight: notifs ? '700' : '500', color: notifs ? Colors.text_title : Colors.text}}>Notifications</Text>
            </Pressable>
            <Pressable onPress={() => navPress(`/profile/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
              <View style={{width: 40, alignItems: 'center'}}>
              <UserAvatar pictureUrl={user.pictureUrl ?? null} style={{width: 32, height: 32, borderRadius: 16}} />
              </View>
              <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Profile</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => navPress(`/login`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
            <View style={{width: 40, alignItems: 'center'}}>
            <FontAwesome name="user-circle" size={24} color={Colors.text} />
            </View>
            <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Login</Text>
          </Pressable>
        )
      }
    </>
  , [user, notifs])

  return (
    <View style={styles.container}>
      {
        !widescreen ? (
          <SideNav menuShown={menuShown} closeMenu={closeMenu} translateX={translateX} width={width} footerImage={require('../assets/foreground.png')}>
            <View style={{flex: 1, justifyContent: 'flex-start', paddingRight: 10, paddingVertical: 5}}>
              <Pressable onPress={() => navPress(`/films/explore?filter=${'ALL'}&value=${'RELEASE DATE'}`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <MaterialIcons name="explore" size={32} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Explore Films</Text>
              </Pressable>
              <Pressable onPress={() => navPress(`/lists/explore?filter=${'ALL'}&value=${'POPULARITY'}`)} style={{marginBottom: user?.userId ? 20 : null, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <FontAwesome6 name="ranking-star" size={24} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Popular Lists</Text>
              </Pressable>
              {
                user?.userId && (
                  <>
                    <Pressable onPress={() => navPress(`/reviews/user/${user.userId}`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <MaterialCommunityIcons name="script-text" size={28} color={Colors.text} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Your Reviews</Text>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/films/watchlist/${user.userId}`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <MaterialCommunityIcons name="bookmark-plus-outline" size={32} color={Colors.text} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Watchlist</Text>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/likes/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <FontAwesome name="heart" size={24} color={Colors.text} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Recently Liked</Text>
                    </Pressable>
                  </>
                )
              }
              <View style={styles.divider} />
              <Pressable onPress={() => navPress(`/about`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <Entypo name="info-with-circle" size={24} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>About</Text>
              </Pressable>
              <Pressable onPress={() => navPress(`/contact`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <Entypo name="old-phone" size={28} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Contact</Text>
              </Pressable>
              <Pressable onPress={() => navPress(`/sponsor`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <FontAwesome6 name="circle-dollar-to-slot" size={28} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '700', color: Colors.text}}>Donate</Text>
              </Pressable>
              {
                user?.userId ? (
                  <>
                    <Pressable onPress={() => navPress(`/notifications`)} style={{marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <View style={{width: 32, height: 32}}>
                        <MaterialIcons name="notifications" size={32} color={notifs ? Colors.text_title : Colors.text} />
                        {notifs && <View style={[styles.badge, {top: 2, right: 2}]} />}
                      </View>
                      </View>
                      <Text style={{fontSize: 20, fontWeight: notifs ? '700' : '500', color: notifs ? Colors.text_title : Colors.text}}>Notifications</Text>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/profile/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <UserAvatar pictureUrl={user.pictureUrl ?? null} style={{width: 32, height: 32, borderRadius: 16}} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Profile</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable onPress={() => navPress(`/login`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                    <View style={{width: 40, alignItems: 'center'}}>
                    <FontAwesome name="user-circle" size={24} color={Colors.text} />
                    </View>
                    <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Login</Text>
                  </Pressable>
                )
              }
            </View>
          </SideNav>
        ) : (
          <View style={{width: 1000, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15}}>
            <View style={{width: 850, flexDirection: 'row', alignItems: 'center', justifyContent: user?.userId ? 'space-evenly' : 'flex-start'}}>
              <Pressable onPress={() => navPress(`/films/explore?filter=${'ALL'}&value=${'RELEASE DATE'}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <MaterialIcons name="explore" size={32} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Explore Films </Text>
              </Pressable>
              <Pressable onPress={() => navPress(`/lists/explore?filter=${'ALL'}&value=${'POPULARITY'}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: 40, alignItems: 'center'}}>
                <FontAwesome6 name="ranking-star" size={24} color={Colors.text} />
                </View>
                <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}> Popular Lists</Text>
              </Pressable>
              {
                user?.userId && (
                  <>
                    <Pressable onPress={() => navPress(`/reviews/user/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 36, alignItems: 'center'}}>
                      <MaterialCommunityIcons name="script-text" size={28} color={Colors.text} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Your Reviews</Text>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/films/watchlist/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 36, alignItems: 'center'}}>
                      <MaterialCommunityIcons name="bookmark-plus-outline" size={32} color={Colors.text} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Watchlist</Text>
                    </Pressable>
                    <Pressable onPress={() => navPress(`/likes/${user.userId}`)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                      <View style={{width: 40, alignItems: 'center'}}>
                      <FontAwesome name="heart" size={24} color={Colors.text} />
                      </View>
                      <Text style={{fontSize: 20, fontWeight: '500', color: Colors.text}}>Recently Liked</Text>
                    </Pressable>
                  </>
                )
              }
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
              <Dropdown ref={dropdownRef} user={user} notifs={notifs}>
                {DropdownChildren}
              </Dropdown>
            </View>
          </View>
        )
      }

      <ScrollView
        contentContainerStyle={{
          width: widescreen ? 1000 : width*0.95,
          alignSelf: 'center',
          marginTop: widescreen ? 35 : null
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={{color: Colors.text_title, fontSize: widescreen ? 32 : 24, fontWeight: 'bold', textAlign: 'center'}}>What are we watching today, {user?.name || 'stranger'}?</Text>

        <Text style={[styles.regionalTitle, { marginBottom: 10, marginTop: widescreen ? 50 : 30 }]}>Trending Globally</Text>
        <View 
          style={{width: colPosterWidth * 4.1 + spacing * 4, maxWidth: '100%', alignSelf: 'center'}}>
          {!trending || trending.length === 0 ? (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <ActivityIndicator size="large" color={Colors.text_link} />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{ maxWidth: Math.min(width * 0.95, 1000), paddingBottom: 10 }}
              contentContainerStyle={{alignItems: 'center'}}
              data={trending}
              keyExtractor={(item) => item.filmId.toString()}
              renderItem={({ item }) => {
                return (
                  <Pressable
                    onPress={() => router.push(`/film/${item.filmId}`)}
                    style={{ marginRight: spacing }}
                  >
                    <Poster
                      posterUrl={item?.filmPosterUrl ?? null}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: Colors.border_color,
                      }}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        <Text style={[styles.regionalTitle, { marginBottom: 10, marginTop: widescreen ? 50 : 30 }]}>Popular on Heteroboxd</Text>
        <View
          style={{
            width: colPosterWidth * 4.1 + spacing * 4,
            maxWidth: "100%",
            alignSelf: "center",
          }}
        >
          {popular.length === 0 ? (
            <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
              <ActivityIndicator size="large" color={Colors.text_link} />
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={widescreen}
              style={{ maxWidth: Math.min(width * 0.95, 1000), paddingBottom: 10 }}
              contentContainerStyle={{alignItems: 'center'}}
              data={popular}
              keyExtractor={(item) => item.filmId.toString()}
              renderItem={({ item }) => {
                return (
                  <Pressable
                    onPress={() => router.push(`/film/${item.filmId}`)}
                    style={{ marginRight: spacing }}
                  >
                    <Poster
                      posterUrl={item?.posterUrl ?? null}
                      style={{
                        width: colPosterWidth,
                        height: colPosterHeight,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: Colors.border_color,
                      }}
                    />
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        {
          user ? (
            <>
              <Text style={[styles.regionalTitle, { marginBottom: 10, marginTop: widescreen ? 50 : 30 }]}>Your Friends Watched</Text>
              <View
                style={{
                  width: widescreen ? 1000 : width*0.95,
                  alignSelf: "center",
                }}
              >
                {!reviews ? (
                  <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
                    <ActivityIndicator size="large" color={Colors.text_link} />
                  </View>
                ) : reviews.length === 0 ? (
                  <View style={{ width: '90%', paddingVertical: 30, alignSelf: 'center' }}>
                    <Text style={{textAlign: 'center', fontSize: widescreen ? 20 : 16, color: Colors.text}}>Nothing to see here! Might be time to find some new friends...</Text>
                  </View>
                ) : (
                  <View style={{ width: Math.min(width * 0.95, 1000), paddingBottom: 10, alignItems: 'center' }}>
                    {reviews.map((item) => (
                      <View key={item.id.toString()} style={[styles.card, { marginBottom: 10 }]}>
                          <View style={{ marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
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
                            <Text style={{ padding: 5, fontWeight: '600', textAlign: 'left', fontSize: widescreen ? 20 : 16, color: Colors.text_title }}>
                              {item.filmTitle}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
                              <View style={{ width: colPosterWidth, height: colPosterHeight, marginRight: 5 }}>
                                <Poster
                                  posterUrl={item.filmPosterUrl ?? null}
                                  style={{
                                    width: colPosterWidth,
                                    height: colPosterHeight,
                                    borderWidth: 2,
                                    borderRadius: 6,
                                    borderColor: Colors.border_color,
                                  }}
                                />
                              </View>
                              {item.text && item.text.length > 0 ? (
                                <View style={{ width: maxRowWidth - colPosterWidth - 10, maxHeight: colPosterHeight, overflow: 'hidden' }}>
                                  <ParsedRead html={`${item.text.replace(/\n{2,}/g, '\n').trim().slice(0, 200)}${item.text.length > 200 ? '...' : ''}`} />
                                </View>
                              ) : (
                                <View style={{ width: maxRowWidth - colPosterWidth - 10 }}>
                                  <Text style={{ color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center' }}>
                                    {item.authorName} wrote no review regarding this film.
                                  </Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.statsRow}>
                              <FontAwesome name="heart" size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
                              <Text style={[styles.statText, { fontSize: widescreen ? 16 : 12 }]}>{format.formatCount(item.likeCount)}</Text>
                            </View>
                          </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              <Text style={[styles.regionalTitle, { marginBottom: 10, marginTop: widescreen ? 50 : 30 }]}>New from Friends</Text>
              <View
                style={{
                  width: widescreen ? 1000 : width*0.95,
                  alignSelf: "center",
                }}
              >
                {!lists ? (
                  <View style={{ width: "100%", alignItems: "center", paddingVertical: 30 }}>
                    <ActivityIndicator size="large" color={Colors.text_link} />
                  </View>
                ) : lists.length === 0 ? (
                  <View style={{ width: '90%', paddingVertical: 30, alignSelf: 'center' }}>
                    <Text style={{textAlign: 'center', fontSize: widescreen ? 20 : 16, color: Colors.text}}>Nothing to see here! Might be time to find some new friends...</Text>
                  </View>
                ) : (
                  <View style={{ width: Math.min(width * 0.95, 1000), paddingBottom: 10, alignItems: 'center' }}>
                    {lists.map((item) => (
                      <View key={item.id.toString()} style={[styles.card, { marginBottom: 10 }]}>
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
                          <Text style={[styles.listTitle, {fontSize: widescreen ? 22 : 18}]}>{item.name}</Text>

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
                              ));
                            })()}
                          </View>
                          
                          <Text style={[styles.description, {fontSize: widescreen ? 18 : 14}]}>
                            {item.description.slice(0, widescreen ? 500 : 150)}
                            {widescreen && item.description.length > 500 && '...'}
                            {!widescreen && item.description.length > 150 && '...'}
                          </Text>
                          
                          <View style={styles.statsRow}>
                            <Fontisto name="nav-icon-list-a" size={widescreen ? 18 : 14} color={Colors._heteroboxd} />
                            <Text style={[styles.statText, {color: Colors._heteroboxd, fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.listEntryCount)} </Text>
                            <Fontisto name="heart" size={widescreen ? 18 : 14} color={Colors.heteroboxd} />
                            <Text style={[styles.statText, {fontSize: widescreen ? 18 : 14}]}>{format.formatCount(item.likeCount)}</Text>
                          </View>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : (
            <Link href="/login" style={{marginVertical: 50, textAlign: 'center', color: Colors.text, fontWeight: 'bold', fontSize: widescreen ? 24 : 18}}><Text style={{color: Colors.heteroboxd}}>SIGN IN</Text> or <Text style={{color: Colors._heteroboxd}}>JOIN</Text> Heteroboxd for <Text style={{color: Colors.text_title}}>FREE</Text> to track and rate films, write reviews, create lists, interact with other users, and access other members-only features!</Link>
          )
        }

        <Text style={{marginTop: widescreen ? 250 : 100, color: Colors.text, fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>Heteroboxd uses <Link style={{color: Colors.heteroboxd}} href="https://developer.themoviedb.org/docs/getting-started">tMDB's API</Link> for film data, bearing no endorsement whatsoever.</Text>
      </ScrollView>
      <Popup visible={result === 500} message={message} onClose={() => { router.replace('/contact') }} />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 50,
      backgroundColor: Colors.background,
  },
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
  divider: {
    height: 1.5,
    backgroundColor: Colors.text,
    marginVertical: 20,
    width: "90%",
    alignSelf: "center",
    opacity: 0.5,
    marginRight: -10
  },
})