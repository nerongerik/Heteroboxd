import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Head from 'expo-router/head'
import * as auth from '../../helpers/auth'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import Popup from '../../components/popup'
import RelationshipTabs from '../../components/tabs/relationshipTabs'

const PAGE_SIZE = 32

const Relationships = () => {
  const { userId, t } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ followers, setFollowers ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ following, setFollowing ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ blocked, setBlocked ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()
  const requestRef = useRef(0)
  const loadingRef = useRef(0)
  const [ isRefreshing, setIsRefreshing ] = useState(false)

  const isOwnProfile = useMemo(() => user?.userId === userId, [user, userId])

  const loadData = useCallback(async (pages = {}, fromRefresh = false) => {
    if (fromRefresh) setIsRefreshing(false)
    setServer(Response.loading)
    const params = new URLSearchParams({
      FollowersPage: pages.followers || 1,
      FollowingPage: pages.following || 1,
      BlockedPage: pages.blocked || 1,
      PageSize: PAGE_SIZE
    })
    try {
      if (loadingRef.current) return
      const requestId = ++requestRef.current
      loadingRef.current = true
      const res = await fetch(`${BaseUrl.api}/users/relationships?UserId=${userId}&${params}`)
      if (res.ok) {
        if (requestId !== requestRef.current) return
        const json = await res.json()
        if (pages.followers === 0) {
          console.log('followers sleeping')
        } else if (!pages.followers || pages.followers === 1) {
          setFollowers({
            page: json.followers.page,
            items: json.followers.items.map(uir => ({
              id: uir.id, 
              name: uir.name, 
              pictureUrl: uir.pictureUrl, 
              admin: uir.admin
            })),
            totalCount: json.followers.totalCount
          })
        } else {
          setFollowers(prev => ({
            ...prev,
            page: json.followers.page,
            items: [...prev.items, ...json.followers.items.map(uir => ({ id: uir.id, name: uir.name, pictureUrl: uir.pictureUrl, admin: uir.admin }))]
          }))
        }
        if (pages.following === 0) {
          console.log('following sleeping')
        } else if (!pages.following || pages.following === 1) {
          setFollowing({
            page: json.following.page,
            items: json.following.items.map(uir => ({
              id: uir.id, 
              name: uir.name, 
              pictureUrl: uir.pictureUrl, 
              admin: uir.admin
            })),
            totalCount: json.following.totalCount
          })
        } else {
          setFollowing(prev => ({
            ...prev,
            page: json.following.page,
            items: [...prev.items, ...json.following.items.map(uir => ({ id: uir.id, name: uir.name, pictureUrl: uir.pictureUrl, admin: uir.admin }))]
          }))
        }
        if (isOwnProfile) {
          if (pages.blocked === 0) {
            console.log('blocked sleeping')
          } else if (!pages.blocked || pages.blocked === 1) {
            setBlocked({
              page: json.blocked.page,
              items: json.blocked.items.map(uir => ({
                id: uir.id, 
                name: uir.name, 
                pictureUrl: uir.pictureUrl, 
                admin: uir.admin
              })),
              totalCount: json.blocked.totalCount
            })
          } else {
            setBlocked(prev => ({
              ...prev,
              page: json.blocked.page,
              items: [...prev.items, ...json.blocked.items.map(uir => ({ id: uir.id, name: uir.name, pictureUrl: uir.pictureUrl, admin: uir.admin }))]
            }))
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
  }, [userId, isOwnProfile])

  const loadPage = useCallback((tab, page) => {
    loadData({
      followers: tab === 'followers' ? page : 0,
      following: tab === 'following' ? page : 0,
      blocked:   tab === 'blocked'   ? page : 0,
    })
  }, [loadData])

  const handleRemoveFollower = useCallback(async (followerId) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/relationships?TargetId=${followerId}&Action=remove-follower`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${jwt}` }
      })
      if (res.ok) {
        loadData()
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <>
    <Head>
      <title>Relationships</title>
      <meta name="description" content="The users you follow, are followed by, or have blocked." />
      <meta property="og:title" content="Relationships" />
      <meta property="og:description" content="The users you follow, are followed by, or have blocked." />
    </Head>
    <View style={{flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', paddingBottom: 50}}>
      <RelationshipTabs
        isMyProfile={isOwnProfile}
        followers={followers}
        following={following}
        blocked={blocked}
        onUserPress={(uid) => router.push(`/profile/${uid}`)}
        onRemoveFollower={(followerId) => handleRemoveFollower(followerId)}
        onPageChange={loadPage}
        active={t}
        pageSize={PAGE_SIZE}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          setIsRefreshing(true)
          loadData({followers: 1, following: 1, blocked: 1}, true)
        }}
        loading={server.result <= 0}
      />

      <Popup
        visible={[403, 404, 500].includes(server.result)}
        message={server.message}
        onClose={() => { server.result === 403 ? router.replace('/login') : server.result === 404 ? router.back() : router.replace('/contact')}}
      />
    </View>
    </>
  )
}

export default Relationships