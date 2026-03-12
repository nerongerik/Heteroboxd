import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Foundation from '@expo/vector-icons/Foundation'
import { Snackbar } from 'react-native-paper'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Divider from '../../components/divider'
import Histogram from '../../components/histogram'
import LoadingResponse from '../../components/loadingResponse'
import PaginationBar from '../../components/paginationBar'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import ProfileOptionsButton from '../../components/optionButtons/profileOptionsButton'
import SearchBox from '../../components/searchBox'
import SlidingMenu from '../../components/slidingMenu'
import { UserAvatar } from '../../components/userAvatar'

const RECENTS = 8
const PAGE_SIZE = 20

const Profile = () => {
  const { userId } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ data, setData ] = useState(null)
  const [ server, setServer ] = useState(Response.initial)
  const [ ratings, setRatings ] = useState({})
  const { width, height } = useWindowDimensions()
  const navigation = useNavigation()
  const router = useRouter()
  const [ snack, setSnack ] = useState({ shown: false, msg: '' })
  const [ favorites, setFavorites ] = useState([])
  const [ recent, setRecent ] = useState(null)
  const [ blocked, setBlocked ] = useState(false)
  const [ following, setFollowing ] = useState(false)
  const [ followLabel, setFollowLabel ] = useState('FOLLOW')
  const [ menuShown2, setMenuShown2 ] = useState(false)
  const slideAnim2 = useState(new Animated.Value(0))[0]
  const [ favIndex, setFavIndex ] = useState(-1)
  const [ searchResults, setSearchResults ] = useState({items: [], totalCount: 0, page: 1})
  const [ searchInit, setSearchInit ] = useState(true)

  const openMenu2 = () => {
    setMenuShown2(true)
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }
  const closeMenu2 = () => {
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setMenuShown2(false))
  }
  const translateY2 = slideAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0]
  })

  const isOwnProfile = useMemo(() => user?.userId === userId, [user, userId])

  const loadProfileData = useCallback(async () => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/users?UserId=${userId}&Inclusive=${true}${!isOwnProfile && user?.userId ? `&VisitorId=${user.userId}` : ''}`)
      if (res.ok) {
        const json = await res.json()
        setRatings(json.ratings)
        if (!isOwnProfile) {
          const trimmed = json.relationship.replace(/^"|"$/g, '').trim().toLowerCase()
          if (trimmed === 'blocked') {
            setBlocked(true)
          } else if (trimmed === 'following') {
            setFollowing(true)
            setFollowLabel('UNFOLLOW')
          } else if (trimmed === 'followed') {
            setFollowing(false)
            setFollowLabel('FOLLOW BACK')
          } else {
            setFollowing(false)
            setFollowLabel('FOLLOW')
          }
        }
        setData({ 
          name: json.profile.name, pictureUrl: json.profile.pictureUrl, bio: json.profile.bio, gender: json.profile.gender, admin: json.profile.admin,
          joined: format.parseDate(json.profile.joined), flags: json.profile.flags, watchlistCount: json.profile.watchlistCount,
          listsCount: json.profile.listsCount, followersCount: json.profile.followersCount, followingCount: json.profile.followingCount,
          blockedCount: json.profile.blockedCount, reviewsCount: json.profile.reviewsCount, likes: json.profile.likes, watched: json.profile.watched
        })
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
        setData({})
      } else {
        setServer(Response.internalServerError)
        setData({})
      }
    } catch {
      setServer(Response.networkError)
      setData({})
    }
  }, [userId, user, isOwnProfile])

  const loadFilmData = useCallback(async () => {
    try {
      const res = await fetch(`${BaseUrl.api}/users/subsequent?UserId=${userId}&PageSize=${RECENTS}`)
      if (res.ok) {
        const json = await res.json()
        setFavorites([json.favorites["1"] || null, json.favorites["2"] || null, json.favorites["3"] || null, json.favorites["4"] || null])
        setRecent({ films: json.recents.items, totalCount: json.recents.totalCount })
      } else {
        setFavorites([null, null, null, null])
        setRecent({ films: [], totalCount: 0 })
        console.log('failed to fetch favorites and recents; internal server error...')
      }
    } catch {
      setFavorites([null, null, null, null])
      setRecent({ films: [], totalCount: 0 })
      console.log('failed to fetch favorites and recents; network error...')
    }
  }, [userId])

  const handleButtons = (button) => {
    switch (button) {
      case 'Watched':
        router.push(`/films/user-watched/${userId}`)
        break
      case 'Watchlist':
        router.push(`/films/watchlist/${userId}`)
        break
      case 'Reviews':
        router.push(`/reviews/user/${userId}`)
        break
      case 'Lists':
        if (data.listsCount === '0') router.push(`/list/create`)
        else router.push(`/lists/user/${userId}`)
        break
      case 'Likes':
        router.push(`/likes/${userId}`)
        break
      case 'Followers':
        router.push(`/relationships/${userId}?t=followers`)
        break
      case 'Following':
        router.push(`/relationships/${userId}?t=following`)
        break
      case 'Blocked':
        router.push(`/relationships/${userId}?t=blocked`)
        break
      default:
        setSnack({ shown: true, msg: 'You cannot access that functionality.' })
    }
  }

  const handleFollow = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setSnack({ shown: true, msg: 'Session expired! Try logging in again.' })
      return
    }
    if (following) {
      setFollowing(false)
      setFollowLabel(followLabel === 'UNFOLLOW' ? 'FOLLOW' : followLabel)
    } else {
      setFollowing(true)
      setFollowLabel('UNFOLLOW')
    }
    const jwt = await auth.getJwt()
    const res = await fetch(`${BaseUrl.api}/users/relationships?TargetId=${userId}&Action=follow-unfollow`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${jwt}` }
    })
    if (!res.ok) {
      console.log('follow/unfollow failed; debugging...')
    }
  }, [user, userId, following, followLabel])

  const updateFavorites = useCallback(async (filmId, index) => {
    if (!user || !isOwnProfile || !(await isValidSession())) {
      setSnack({ shown: true, msg: 'Session expired! Try logging in again.' })
      return
    }
    const jwt = await auth.getJwt()
    const i = index ? index : favIndex
    const res = await fetch(`${BaseUrl.api}/users/favorites?FilmId=${filmId}&Index=${i}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${jwt}` }
    })
    if (res.ok) {
      const json = await res.json()
      setFavorites([json["1"], json["2"], json["3"], json["4"]])
    } else {
      setSnack({ shown: true, msg: `${res.status}: Something went wrong! Try reloading Heteroboxd.` })
    }
  }, [user, isOwnProfile, favIndex])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  useEffect(() => {
    if (!user) return
    navigation.setOptions({
      headerTitle: '',
      headerRight: () => <ProfileOptionsButton userId={userId} blocked={blocked} />
    })
  }, [navigation, blocked, user])

  useEffect(() => {
    if (!data) return
    loadFilmData()
  }, [data, loadFilmData])

  const totalPages = Math.ceil(searchResults.totalCount / PAGE_SIZE)
  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4.1, [maxRowWidth, spacing])
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth])
  const followButtonColor = followLabel === 'UNFOLLOW' ? Colors.heteroboxd : Colors._heteroboxd

  if (!data) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  if (blocked) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <Text style={styles.text}>You have blocked this user.</Text>
      </View>
    )
  }

  return (
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50}}>
      <ScrollView contentContainerStyle={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={{marginBottom: 15}}>
            <UserAvatar pictureUrl={data.pictureUrl} style={width < 500 ? styles.smallWebProfile : styles.profileImage} />
          </View>
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Text style={styles.username}>{data.name}{data.admin && <Text style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</Text>}</Text>
          </View>
          {!isOwnProfile && (
            <Pressable
              onPress={handleFollow}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 3,
                borderColor: followButtonColor,
                borderRadius: 3,
                paddingVertical: widescreen ? 8 : 6,
                paddingHorizontal: widescreen ? 8 : 6,
                justifyContent: 'center',
                alignSelf: 'center'
              }}
            >
              <Text style={{fontSize: widescreen ? 16 : 12, fontWeight: '700', color: followButtonColor, textAlign: 'center'}}>{followLabel}</Text>
            </Pressable>
          )}
        </View>

        <View style={{marginVertical: 5}} />

        <View style={styles.bio}>
          {
            data.gender?.toLowerCase() === 'male' ? (
              <Foundation name='male-symbol' size={24} color={Colors.male} />
            ) : (
              <Foundation name='female-symbol' size={24} color={Colors.female} />
            )
          }
          <Text style={styles.text}>{data.bio}</Text>
        </View>

        <Divider marginVertical={20} />

        <Text style={styles.subtitle}>Favorites</Text>
        <FlatList
          horizontal
          data={favorites}
          keyExtractor={(_, index) => index.toString()}
          ListEmptyComponent={<View style={{width: maxRowWidth, paddingVertical: 30, alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>}
          renderItem={({ item, index }) => (
            <Pressable
              onLongPress={() => isOwnProfile ? updateFavorites(-1, index + 1) : null}
              onPress={() => {
                if (item === 'error') {
                  setSnack({ shown:  true, msg: 'There was an error loading this film.' })
                } else if (item?.filmId) {
                  router.push(`/film/${item.filmId}`)
                } else if (!isOwnProfile) {
                  setSnack({ shown:  true, msg: 'You cannot choose favorites for other people!' })
                } else {
                  setFavIndex(index + 1)
                  openMenu2()
                }
              }}
            >
              <Poster
                posterUrl={item === 'error' ? 'error' : (item?.posterUrl || null)}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: Colors.border_color
                }}
                other={!isOwnProfile}
              />
            </Pressable>
          )}
          contentContainerStyle={{width: maxRowWidth, justifyContent: 'space-between'}}
          showsHorizontalScrollIndicator={false}
        />

        <Divider marginVertical={20} />
        
        <Text style={[styles.subtitle, {marginBottom: 10}]}>Ratings</Text>
        {
          Object.entries(ratings).length > 0 ? (
            <Histogram histogram={ratings} />
          ) : (
            <View style={{alignSelf: 'center', alignItems: 'center', paddingVertical: 30}}><Text style={styles.text}>Nothing to see here.</Text></View>
          )
        }

        <Divider marginVertical={20} />

        <Pressable onPress={() => {router.push(`/films/user-watched/${userId}`)}}>
          <Text style={styles.subtitle}>Recents</Text>
        </Pressable>
        <View style={{width: colPosterWidth * 4.1 + spacing * 4, maxWidth: '100%', alignSelf: 'center'}}>
          {
            !recent ? (
              <View style={{width: maxRowWidth, alignItems: 'center', paddingVertical: 30}}>
                <ActivityIndicator size='large' color={Colors.text_link} />
              </View>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={widescreen}
                style={{width: maxRowWidth, paddingBottom: 10}}
                contentContainerStyle={{alignItems: 'center'}}
                data={recent.films}
                keyExtractor={(item) => item.filmId.toString()}
                ListEmptyComponent={<View style={{width: maxRowWidth, alignSelf: 'center', alignItems: 'center', paddingVertical: 30}}><Text style={styles.text}>Nothing to see here.</Text></View>}
                renderItem={({ item }) => {
                  return (
                    <Pressable onPress={() => router.push(`/film/${item.filmId}`)} style={{marginRight: spacing}}>
                      <Poster
                        posterUrl={item?.posterUrl ?? null}
                        style={{
                          width: colPosterWidth,
                          height: colPosterHeight,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: Colors.border_color
                        }}
                      />
                    </Pressable>
                  )
                }}
              />
            )
          }
        </View>

        <Divider marginVertical={20} />

        <View style={styles.buttons}>
          {[
            ...(isOwnProfile ? [{ label: 'Watchlist', count: data.watchlistCount }] : []),
            { label: 'Watched', count: recent?.totalCount },
            { label: 'Reviews', count: data.reviewsCount },
            { label: 'Lists', count: data.listsCount },
            { label: 'Likes', count: data.likes },
            { label: 'Followers', count: data.followersCount },
            { label: 'Following', count: data.followingCount },
            ...(isOwnProfile ? [{ label: 'Blocked', count: data.blockedCount }] : []),
          ]
          .map((item, index) => {
            const disabled = item.label === 'Lists' ? (isOwnProfile ? false : item.count === 0) : item.count === 0
            return (
              <Pressable
                key={index}
                disabled={disabled}
                onPress={() => {handleButtons(item.label)}}
                style={[styles.boxButton, (disabled) && { opacity: 0.5 }]}
              >
                <Text style={[styles.boxButtonText, { color: Colors.text_title }]}>
                  {item.label}
                </Text>
                <Text style={[styles.boxButtonText, { color: Colors.text_title }]}>
                  {format.formatCount(item.count)} {'➜'}
                </Text>
              </Pressable>
            )
          })}
          <Text style={[styles.text, {marginTop: 50}]}>joined {data.joined}</Text>
        </View>
      </ScrollView>

      <Popup
        visible={[404, 500].includes(server.result)} 
        message={server.message} 
        onClose={() => server.result === 404 ? router.back() : router.replace('/contact')}
      />

      <Snackbar
        visible={snack.shown}
        onDismiss={() => setSnack(prev => ({...prev, shown: false}))}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? width*0.5 : width*0.9,
          alignSelf: 'center',
          borderRadius: 8
        }}
        action={{
          label: 'OK',
          onPress: () => setSnack(prev => ({...prev, shown: false})),
          textColor: Colors.text_link
        }}
      >
        {snack.msg}
      </Snackbar>

      <SlidingMenu
        menuShown={menuShown2} 
        closeMenu={() => {setSearchResults({items: [], totalCount: 0, page: 1}); setSearchInit(true); closeMenu2()}} 
        translateY={translateY2} 
        widescreen={widescreen} 
        width={width}
      >
        <SearchBox
          onSelected={(res) => {setSearchResults(res); setSearchInit(false)}}
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
            renderItem={({item, index}) => (
              <Pressable key={index} onPress={() => {
                setSearchResults({items: [], totalCount: 0, page: 1});
                setSearchInit(true)
                updateFavorites(item.filmId);
                closeMenu2();
              }}>
                <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
                  <Poster posterUrl={item.posterUrl} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} />
                  <View style={{flexShrink: 1, maxWidth: '100%'}}>
                    <Text style={{color: Colors.text_title, fontSize: 16}} numberOfLines={3} ellipsizeMode='tail'>
                      {item.title} <Text style={{color: Colors.text, fontSize: 14}}>{item.releaseYear || ''}</Text>
                    </Text>
                    <Text style={{color: Colors.text, fontSize: 12}}>Directed by {
                      item.castAndCrew?.map((d, i) => (
                        <Text key={i} style={{}}>
                          {d.celebrityName ?? ''}{i < item.castAndCrew.length - 1 && ', '}
                        </Text>
                      ))
                    }</Text>
                  </View>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              !searchInit && <View style={{width: widescreen ? width*0.5 : width*0.95, alignSelf: 'center'}}><Text style={{padding: 20, textAlign: 'center', color: Colors.text, fontSize: 16}}>We found no records matching your query.</Text></View>
            }
            ListFooterComponent={
              <View style={{ width: widescreen ? width*0.5 : width*0.95 }}>
                <PaginationBar
                  page={searchResults.page}
                  totalPages={totalPages}
                  onPagePress={(num) => {setSearchResults(prev => ({ ...prev, page: num }))}}
                />
              </View>
            }
            contentContainerStyle={{padding: 20, alignItems: 'flex-start', width: '100%'}}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SlidingMenu>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  profile: {
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 25,
    fontWeight: "700",
    marginBottom: 5,
    color: Colors.text_title,
    textAlign: "center"
  },
  bio: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 5,
    width: '75%',
  },
  ratings: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 0,
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontWeight: "500",
    marginBottom: 5,
    marginLeft: 12,
    fontSize: 20,
    color: Colors.text_title,
    textAlign: "left",
  },
  subtext: {
    fontWeight: "100",
    fontSize: 12,
    color: Colors.text_placeholder,
    textAlign: "justify",
    fontStyle: 'italic',
    marginTop: 0,
  },
  divider: {
    width: "75%",
    alignSelf: "center",
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border_color,
    opacity: 0.5,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  },
  smallWebProfile: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  },
  boxButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: 'space-between',
    
  },
  boxButtonText: {
    fontSize: 18,
    fontWeight: "400",
    textAlign: "right",
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
    fontSize: 16
  },
})