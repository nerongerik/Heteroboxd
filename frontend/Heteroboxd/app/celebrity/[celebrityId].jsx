import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, Pressable, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import CelebrityTabs from '../../components/tabs/celebrityTabs'
import FilterSort from '../../components/filterSort'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 24
const FILTER_TO_ROLE_MAP = {
  'Starred': 'Actor',
  'Directed': 'Director',
  'Wrote': 'Writer',
  'Produced': 'Producer',
  'Composed': 'Composer',
}
const ROLE_TO_FILTER_MAP = {
  'Actor': 'Starred',
  'Director': 'Directed',
  'Writer': 'Wrote',
  'Producer': 'Produced',
  'Composer': 'Composed',
}

const Celebrity = () => {
  const { user } = useAuth()
  const { celebrityId, t } = useLocalSearchParams()
  const [ bio, setBio ] = useState(null)
  const [ availableRoles, setAvailableRoles ] = useState([])
  const [ currentTabData, setCurrentTabData ] = useState({ films: [], totalCount: 0, page: 1 })
  const [ seenFilms, setSeenFilms ] = useState([])
  const [ seenCount, setSeenCount ] = useState(0)
  const [ fadeSeen, setFadeSeen ] = useState(true)
  const [ server, setServer ] = useState(Response.initial)
  const [ currentFilter, setCurrentFilter ] = useState('Bio')
  const [ currentSort, setCurrentSort ] = useState({ field: "RELEASE DATE", desc: true })
  const { width } = useWindowDimensions()
  const router = useRouter()
  const navigation = useNavigation()
  const [ menuShown, setMenuShown ] = useState(false)
  const slideAnim = useState(new Animated.Value(0))[0]

  const openMenu = () => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false))
  }
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  })

  const loadBioData = useCallback(async () => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/celebrities/${celebrityId}`)
      if (res.ok) {
        const json = await res.json()
        setBio(json)
        setAvailableRoles((json.roles ?? []).map(role => ROLE_TO_FILTER_MAP[role]).filter(Boolean))
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [celebrityId])

  const loadCreditsData = useCallback(async (filter, page = 1) => {
    setServer(Response.loading)
    if (!filter || filter === 'Bio') {
      setCurrentTabData({ films: [], totalCount: 0, page: 1 })
      setServer(Response.ok)
      return
    }
    const role = FILTER_TO_ROLE_MAP[filter]
    if (!role) {
      setServer(Response.badRequest)
      return
    }
    try {
      const url = user
        ? `${BaseUrl.api}/celebrities/${celebrityId}/credits?UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${role}&Sort=${currentSort.field}&Desc=${currentSort.desc}`
        : `${BaseUrl.api}/celebrities/${celebrityId}/credits?Page=${page}&PageSize=${PAGE_SIZE}&Filter=${role}&Sort=${currentSort.field}&Desc=${currentSort.desc}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setCurrentTabData({ films: json.items, totalCount: json.totalCount, page: json.page })
        setSeenFilms(json.seen)
        setSeenCount(json.seenCount)
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user, celebrityId, currentSort])

  const handleTabChange = useCallback((newTab) => {
    setCurrentFilter(newTab)
    if (newTab !== 'Bio') {
      loadCreditsData(newTab, 1)
    }
  }, [loadCreditsData])

  const handlePageChange = useCallback((page) => {
    loadCreditsData(currentFilter, page)
  }, [currentFilter, loadCreditsData])

  useEffect(() => {
    loadBioData()
  }, [celebrityId])

  useEffect(() => {
    if (!t || t.length === 0) {
      setCurrentFilter('Bio')
      return
    }
    const normalized = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    let filter = 'Bio'
    if (['Starred', 'Acted'].includes(normalized)) {
      filter = 'Starred'
    } else if (FILTER_TO_ROLE_MAP[normalized]) {
      filter = normalized
    }
    setCurrentFilter(filter)
    if (filter !== 'Bio') {
      loadCreditsData(filter, 1)
    }
  }, [])

  useEffect(() => {
    if (currentFilter && currentFilter !== 'Bio') {
      loadCreditsData(currentFilter, 1)
    }
  }, [currentSort])

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: bio?.celebrityName ?? '',
      headerTitleAlign: 'center',
      headerTitleStyle: { color: Colors.text_title },
      headerRight: () => (
        <Pressable onPress={openMenu} style={{ marginRight: widescreen ? 15 : null }}>
          <Ionicons name='options' size={24} color={Colors.text} />
        </Pressable>
      ),
    })
  }, [navigation, bio, widescreen, openMenu])

  if (!bio) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    )
  }

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <CelebrityTabs
        bio={{text: bio.celebrityDescription || 'This individual is indescribable.', url: bio.celebrityPictureUrl}}
        currentTabData={currentTabData}
        availableRoles={availableRoles}
        activeTab={currentFilter}
        onTabChange={handleTabChange}
        onFilmPress={(filmId) => router.push(`/film/${filmId}`)}
        onPageChange={handlePageChange}
        pageSize={PAGE_SIZE}
        showSeen={user}
        flipShowSeen={() => setFadeSeen(prev => !prev)}
        seenFilms={seenFilms}
        seenCount={seenCount}
        fadeSeen={fadeSeen}
      />

      <Popup 
        visible={[404, 500].includes(server.result)} 
        message={server.message} 
        onClose={() => { server.result === 404 ? router.back() : router.replace('/contact') }}
      />

      <LoadingResponse visible={server.result <= 0} />

      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY}
        widescreen={widescreen}
        width={width}
      >
        <FilterSort
          key={`${currentFilter}-${currentSort.field}`}
          context={'celebrity'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {
            setCurrentFilter(newFilter)
            closeMenu()
          }}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  );
};

export default Celebrity