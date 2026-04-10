import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Linking, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, RefreshControl } from 'react-native'
import Male from '../../assets/icons/male.svg'
import Female from '../../assets/icons/female.svg'
import Heart from '../../assets/icons/heart.svg'
import { Snackbar } from 'react-native-paper'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Divider from '../../components/divider'
import Histogram from '../../components/histogram'
import HText from '../../components/htext'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import { Poster } from '../../components/poster'
import ProfileOptionsButton from '../../components/optionButtons/profileOptionsButton'
import SearchBox from '../../components/searchBox'
import SlidingMenu from '../../components/slidingMenu'
import { UserAvatar } from '../../components/userAvatar'
import Author from '../../components/author'
import ParsedRead from '../../components/parsedRead'
import Stars from '../../components/stars'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const RECENTS = 8
const PAGE_SIZE = 50

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
  const [ pinned, setPinned ] = useState({})
  const [ blocked, setBlocked ] = useState(false)
  const [ following, setFollowing ] = useState(false)
  const [ menuShown2, setMenuShown2 ] = useState(false)
  const slideAnim2 = useState(new Animated.Value(0))[0]
  const [ favIndex, setFavIndex ] = useState(-1)
  const [ searchResults, setSearchResults ] = useState({ items: [], totalCount: 0, page: 1, loading: false })
  const [ searchInit, setSearchInit ] = useState(true)
  const followingLocalCopyRef = useRef(null)
  const followRequestRef = useRef(0)
  const [ isRefreshing, setIsRefreshing ] = useState(false)
  const insets = useSafeAreaInsets();

  const translateY2 = slideAnim2.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu2 = useCallback(() => {
    setMenuShown2(true)
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true
    }).start()
  }, [slideAnim2])
  const closeMenu2 = useCallback(() => {
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => setMenuShown2(false))
  }, [slideAnim2])

  const isOwnProfile = useMemo(() => user?.userId === userId, [user, userId])

  const loadProfileData = useCallback(async (fromRefresh = false) => {
    if (fromRefresh) setIsRefreshing(false)
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
          } else {
            setFollowing(false)
          }
        }
        setData({ 
          name: json.profile.name, pictureUrl: json.profile.pictureUrl, bio: json.profile.bio, gender: json.profile.gender, admin: json.profile.admin,
          joined: format.parseDate(json.profile.date), flags: json.profile.flags, watchlistCount: json.profile.watchlistCount,
          listsCount: json.profile.listsCount, followersCount: json.profile.followersCount, followingCount: json.profile.followingCount,
          blockedCount: json.profile.blockedCount, reviewsCount: json.profile.reviewsCount, likes: json.profile.likesCount,
          watched: json.profile.watchedCount, pinnedReviewId: json.profile.pinnedReviewId || null
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
      const res = await fetch(`${BaseUrl.api}/users/subsequent?UserId=${userId}&PageSize=${RECENTS}${data?.pinnedReviewId ? `&Pinned=${data?.pinnedReviewId}` : ''}`)
      if (res.ok) {
        const json = await res.json()
        setFavorites([json.favorites["1"] || null, json.favorites["2"] || null, json.favorites["3"] || null, json.favorites["4"] || null])
        setRecent({ films: json.recents.items.filter(x => x), totalCount: json.recents.totalCount })
        if (json.pinned) setPinned(json.pinned)
      } else {
        setFavorites([null, null, null, null])
        setRecent({ films: [], totalCount: 0 })
        console.log('failed to fetch favorites, recents and pinned; internal server error...')
      }
    } catch {
      setFavorites([null, null, null, null])
      setRecent({ films: [], totalCount: 0 })
      console.log('failed to fetch favorites, recents and pinned; network error...')
    }
  }, [userId, data?.pinnedReviewId])

  const handleButtons = useCallback((button) => {
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
        if (data.listsCount === '0' || data.listsCount === 0) router.push(`/list/create`)
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
  }, [router, userId, data?.listsCount])

  const handleFollow = useCallback(async () => {
    if (!user || !(await isValidSession())) {
      setSnack({ shown: true, msg: 'Session expired! Try logging in again.' })
      return
    }
    const currentFollowing = followingLocalCopyRef.current
    setFollowing(!currentFollowing)
    const requestId = ++followRequestRef.current
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/relationships?TargetId=${userId}&Action=follow-unfollow`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (requestId !== followRequestRef.current) return
      if (!res.ok) {
        console.log('follow/unfollow failed; internal server error...')
      }
    } catch {
      if (requestId !== followRequestRef.current) return
      console.log('follow/unfollow failed; network error...')
    }
  }, [user, followRequestRef, userId])

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
    if (!data) return
    navigation.setOptions({
      headerTitle: '',
      headerRight: () => user ? <ProfileOptionsButton userId={userId} blocked={blocked} /> : null
    })
  }, [navigation, blocked, data, user, userId])

  useEffect(() => {
    loadFilmData()
  }, [loadFilmData])

  useEffect(() => {
    followingLocalCopyRef.current = following
  }, [following])

  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen])
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth])
  const colPosterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4.1, [maxRowWidth, spacing])
  const colPosterHeight = useMemo(() => colPosterWidth * (3 / 2), [colPosterWidth])
  const followButtonColor = useMemo(() => following ? Colors.heteroboxd : Colors._heteroboxd, [following])
  const followLabel = useMemo(() => following ? 'UNFOLLOW' : 'FOLLOW', [following])
  const reviewSpacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const reviewMaxRowWidth = useMemo(() => widescreen ? 900 : width * 0.9, [widescreen, width])
  const reviewPosterWidth = useMemo(() => (reviewMaxRowWidth - reviewSpacing * 4) / 4, [reviewMaxRowWidth, reviewSpacing])
  const reviewPosterHeight = useMemo(() => reviewPosterWidth * (3 / 2), [reviewPosterWidth])

  const Favorite = useCallback(({item, index}) => (
    <Pressable
      onLongPress={() => isOwnProfile ? updateFavorites(-1, index + 1) : null}
      onPress={() => {
        if (item?.id) {
          router.push(`/film/${item.id}`)
        } else if (!isOwnProfile) {
          setSnack({ shown:  true, msg: 'You cannot choose favorites for other people!' })
        } else {
          setFavIndex(index + 1)
          openMenu2()
        }
      }}
    >
      <Poster
        posterUrl={item?.posterUrl || null}
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
  ), [isOwnProfile, updateFavorites, router, openMenu2, posterWidth, posterHeight])

  const Recent = useCallback(({item}) => (
    <Pressable onPress={() => router.push(`/film/${item.id}`)} style={{marginRight: spacing}}>
      <Poster
        posterUrl={item?.posterUrl || 'noposter'}
        style={{
          width: colPosterWidth,
          height: colPosterHeight,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: Colors.border_color
        }}
      />
    </Pressable>
  ), [router, spacing, colPosterWidth, colPosterHeight])

  const SearchResult = useCallback(({item, index}) => (
    <Pressable key={index} onPress={() => {
      setSearchResults({items: [], totalCount: 0, page: 1})
      setSearchInit(true)
      updateFavorites(item.id)
      closeMenu2()
    }}>
      <View style={{flexDirection: 'row', alignItems: 'center', maxWidth: '100%'}}>
        <Poster posterUrl={item.posterUrl || 'noposter'} style={{width: 75, height: 75*3/2, borderRadius: 6, borderColor: Colors.border_color, borderWidth: 1, marginRight: 5, marginBottom: 3}} />
        <View style={{flexShrink: 1, maxWidth: '100%'}}>
          <HText style={{color: Colors.text_title, fontSize: 16}} numberOfLines={3} ellipsizeMode='tail'>
            {item.title} <HText style={{color: Colors.text, fontSize: 14}}>{format.parseOutYear(item.date)}</HText>
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
  ), [updateFavorites, closeMenu2])

  const RenderReview = useMemo(() => (
    <View style={[styles.card, {marginBottom: 5, borderWidth: 2, borderColor: Colors.heteroboxd}]}>
      <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Author
          userId={userId}
          url={data?.pictureUrl || null}
          username={format.sliceText(data?.name || 'Anonymous', widescreen ? 50 : 25)}
          admin={data?.admin}
          router={router}
          widescreen={widescreen}
          dim={widescreen ? 40 : 30}
        />
        <Stars size={widescreen ? 30 : 20} rating={pinned.rating} readonly={true} padding={false} align={'flex-end'} />
      </View>
      <Pressable onPress={() => router.push(`/review/${pinned.id}`)}>
        <HText style={{padding: 5, flex: 1, flexWrap: 'wrap', fontWeight: '600', textAlign: 'left', fontSize: widescreen ? 20 : 16, color: Colors.text_title}}>
          {format.sliceText(pinned.filmTitle || '', widescreen ? 100 : 50)}
        </HText>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
          <View style={{width: reviewPosterWidth, height: reviewPosterHeight, marginRight: 5}}>
            <Poster
              posterUrl={pinned.filmPosterUrl || 'noposter'}
              style={{
                width: reviewPosterWidth,
                height: reviewPosterHeight,
                borderWidth: 2,
                borderRadius: 6,
                borderColor: Colors.border_color
              }}
            />
          </View>
          {pinned.text?.length > 0 ? (
            <View style={{width: reviewMaxRowWidth - reviewPosterWidth - 10, maxHeight: reviewPosterHeight, overflow: 'hidden'}}>
              <ParsedRead html={`${format.sliceText(pinned.text.replace(/\n{2,}/g, '\n').trim(), widescreen ? 250 : 175)}`} contentWidth={reviewMaxRowWidth - reviewPosterWidth - 10} />
            </View>
          ) : (
            <View style={{width: reviewMaxRowWidth - reviewPosterWidth - 10, marginLeft: -5}}>
              <HText style={{color: Colors.text, fontStyle: 'italic', fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>The author was left speechless.</HText>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <Heart height={widescreen ? 16 : 12} width={widescreen ? 16 : 12} fill={Colors.heteroboxd} />
          <HText style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(pinned.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, router, userId, data, pinned, reviewPosterWidth, reviewPosterHeight, reviewMaxRowWidth])

  if (!data) {
    return (
      <>
      <Head>
        <title>Profile</title>
        <meta name="description" content="User's profile page on Heteroboxd." />
        <meta property="og:title" content="Profile" />
        <meta property="og:description" content="User's profile page on Heteroboxd" />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
      </Head>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <LoadingResponse visible={true} />
      </View>
      </>
    )
  }

  if (blocked) {
    return (
      <>
      <Head>
        <title>{data.name}</title>
        <meta name="description" content="You have blocked this user." />
        <meta property="og:title" content={data.name} />
        <meta property="og:description" content="You have blocked this user." />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
      </Head>
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background
      }}>
        <HText style={styles.text}>You have blocked this user.</HText>
      </View>
      </>
    )
  }

  return (
    <>
    <Head>
      <title>{data?.name}</title>
      <meta name="description" content={data?.bio} />
      <meta property="og:title" content={data?.name} />
      <meta property="og:description" content={data?.bio} />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50}}>
      <ScrollView
        contentContainerStyle={{width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={async () => {
              setIsRefreshing(true)
              await loadProfileData(true)
              loadFilmData()
            }}
          />
        }
      >
        <View style={styles.profile}>
          <Pressable onPress={() => Linking.openURL(data.pictureUrl)} style={{marginBottom: 15}}>
            <UserAvatar pictureUrl={data.pictureUrl} style={width < 500 ? styles.smallWebProfile : styles.profileImage} />
          </Pressable>
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <HText style={styles.username}>{data.name}{data.admin && <HText style={{color: Colors._heteroboxd}}>{'[ADMIN]'}</HText>}</HText>
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
              <HText style={{fontSize: widescreen ? 16 : 12, fontWeight: '700', color: followButtonColor, textAlign: 'center'}}>{followLabel}</HText>
            </Pressable>
          )}
        </View>

        <View style={{marginVertical: 5}} />

        <View style={styles.bio}>
          {
            data.gender?.toLowerCase() === 'male' ? (
              <Male width={20} height={20} />
            ) : data.gender?.toLowerCase() === 'female' ? (
              <Female width={20} height={20} />
            ) : null
          }
          <HText style={[styles.text, {fontSize: widescreen ? 18 : 16}]}>{data.bio || ''}</HText>
        </View>

        <Divider marginVertical={20} />

        <HText style={[styles.subtitle, {marginBottom: 10}]}>Favorites</HText>
        <FlatList
          horizontal
          data={favorites}
          keyExtractor={(_, index) => index.toString()}
          ListEmptyComponent={<View style={{width: maxRowWidth, paddingVertical: 30, alignItems: 'center'}}><ActivityIndicator size='large' color={Colors.text_link} /></View>}
          renderItem={Favorite}
          contentContainerStyle={{width: maxRowWidth, justifyContent: 'space-between'}}
          showsHorizontalScrollIndicator={false}
        />

        <Divider marginVertical={20} />
        
        <HText style={[styles.subtitle, {marginBottom: 10}]}>Ratings</HText>
        {
          Object.entries(ratings).length > 0 ? (
            <Histogram histogram={ratings} />
          ) : (
            <View style={{alignSelf: 'center', alignItems: 'center', paddingVertical: 30}}><HText style={styles.text}>Nothing to see here.</HText></View>
          )
        }

        <Divider marginVertical={20} />

        {
          pinned.id &&
            <>
              <HText style={[styles.subtitle, {marginBottom: 10}]}>Pinned Review</HText>
              {RenderReview}
              <Divider marginVertical={20} />
            </>
        }

        <Pressable onPress={() => {router.push(`/films/user-watched/${userId}`)}}>
          <HText style={[styles.subtitle, {marginBottom: 10}]}>Recents</HText>
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
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<View style={{width: maxRowWidth, alignSelf: 'center', alignItems: 'center', paddingVertical: 30}}><HText style={styles.text}>Nothing to see here.</HText></View>}
                renderItem={Recent}
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
                <HText style={[styles.boxButtonText, { color: Colors.text_title }]}>
                  {item.label}
                </HText>
                <HText style={[styles.boxButtonText, { color: Colors.text_title }]}>
                  {format.formatCount(item.count)} {'➜'}
                </HText>
              </Pressable>
            )
          })}
          <HText style={[styles.text, {marginTop: widescreen ? 50 : 100, marginBottom: insets.bottom, fontSize: widescreen ? 16 : 14}]}>joined {data.joined}</HText>
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
    marginLeft: 6,
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
})
