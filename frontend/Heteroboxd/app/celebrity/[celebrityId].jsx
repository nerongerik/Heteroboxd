import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Pressable, useWindowDimensions, View, Platform } from 'react-native'
import Filter from '../../assets/icons/filter.svg'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import * as format from '../../helpers/format'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import CelebrityTabs from '../../components/tabs/celebrityTabs'
import FilterSort from '../../components/filterSort'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import SlidingMenu from '../../components/slidingMenu'

const PAGE_SIZE = 20
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
  const [ currentTabData, setCurrentTabData ] = useState({ page: 1, films: [], totalCount: 0 })
  const seenFilmsRef = useRef(new Set())
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
  const requestRef = useRef(0)
  const loadingRef = useRef(false)
  const [ isRefreshing, setIsRefreshing ] = useState(false)
  
  const translateY = slideAnim.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu = useCallback(() => {
    setMenuShown(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [slideAnim])
  const closeMenu = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false))
  }, [slideAnim])

  const loadBioData = useCallback(async () => {
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/celebrities?CelebrityId=${celebrityId}`)
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

  const loadCreditsData = useCallback(async (filter, page = 1, fromRefresh = false) => {
    if (fromRefresh) setIsRefreshing(false)
    setServer(Response.loading)
    if (!filter || filter === 'Bio') {
      setCurrentTabData({ page: 1, films: [], totalCount: 0 })
      setServer(Response.ok)
      return
    }
    const role = FILTER_TO_ROLE_MAP[filter]
    if (!role) {
      return
    }
    try {
      const url = user
      ? `${BaseUrl.api}/celebrities/credits?CelebrityId=${celebrityId}&UserId=${user.userId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${role}&Sort=${currentSort.field}&Desc=${currentSort.desc}`
      : `${BaseUrl.api}/celebrities/credits?CelebrityId=${celebrityId}&Page=${page}&PageSize=${PAGE_SIZE}&Filter=${role}&Sort=${currentSort.field}&Desc=${currentSort.desc}`
      if (loadingRef.current) return
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(url)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (page === 1) {
          setCurrentTabData({ page: json.page, films: json.items, totalCount: json.totalCount })
          if (user) {
            seenFilmsRef.current = new Set(json.seen)
            setSeenCount(json.seenCount)
          }
        } else {
          setCurrentTabData(prev => ({...prev, page: json.page, films: prev.films.length > 1000 ? [...prev.films.slice(-980), ...json.items] : [...prev.films, ...json.items]}))
          if (user) {
            json.seen.forEach(id => seenFilmsRef.current.add(id))
          }
        }
        setServer(Response.ok)
      } else if (res.status === 404) {
        if (requestId !== requestRef.current) return
        setServer(Response.notFound)
      } else {
        if (requestId !== requestRef.current) return
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    } finally {
      loadingRef.current = false
    }
  }, [user, celebrityId, currentSort])

  const handleTabChange = useCallback((newTab) => {
    setCurrentTabData({ page: 1, films: [], totalCount: 0 })
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

  const widescreen = useMemo(() => width > 1000, [width])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: format.sliceText(bio?.name || '', widescreen ? -1 : 18),
      headerTitleAlign: 'center',
      headerTitleStyle: { color: Colors.text_title, fontFamily: 'Inter_400Regular' },
      headerRight: () => (
        <Pressable onPress={openMenu} style={{ marginRight: widescreen ? 15 : null }}>
          <Filter width={22} height={22} />
        </Pressable>
      ),
    })
    if (Platform.OS === 'web' && bio?.name) {
      document.title = bio?.name
    }
  }, [navigation, bio?.name, widescreen, openMenu])

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
  }, [t])

  useEffect(() => {
    if (currentFilter && currentFilter !== 'Bio') {
      loadCreditsData(currentFilter, 1)
    }
  }, [currentSort])

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
        user={user}
        bio={{text: bio.description || 'This individual is indescribable.', url: bio.headshotUrl || null}}
        currentTabData={currentTabData}
        availableRoles={availableRoles}
        activeTab={currentFilter}
        onTabChange={handleTabChange}
        onFilmPress={(filmId) => router.push(`/film/${filmId}`)}
        onPageChange={handlePageChange}
        pageSize={PAGE_SIZE}
        showSeen={user}
        flipShowSeen={() => setFadeSeen(prev => !prev)}
        seenFilms={seenFilmsRef.current}
        updateSeenFilms={(id) => {
          if (seenFilmsRef.current.has(id)) {
            seenFilmsRef.current.delete(id)
          } else {
            seenFilmsRef.current.add(id)
          }
        }}
        seenCount={seenCount}
        fadeSeen={fadeSeen}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setCurrentTabData({ page: 1, films: [], totalCount: 0 })
          setIsRefreshing(true)
          loadCreditsData(currentFilter, 1, true)
        }}
        loading={server.result <= 0}
      />

      <Popup 
        visible={[404, 500].includes(server.result)} 
        message={server.message} 
        onClose={() => { server.result === 404 ? router.back() : router.replace('/contact') }}
      />

      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY}
        widescreen={widescreen}
        width={width}
      >
        <FilterSort
          context={'celebrity'}
          currentSort={currentSort}
          onSortChange={(newSort) => {closeMenu(); setCurrentTabData({ page: 1, films: [], totalCount: 0 }); setCurrentSort(newSort)}}
        />
      </SlidingMenu>
    </View>
  )
}

export default Celebrity