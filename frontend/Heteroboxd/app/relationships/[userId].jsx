import { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as auth from '../../helpers/auth'
import { useAuth } from '../../hooks/useAuth'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import RelationshipTabs from '../../components/tabs/relationshipTabs'

const PAGE_SIZE = 20

const Relationships = () => {
  const { userId, t } = useLocalSearchParams()
  const { user, isValidSession } = useAuth()
  const [ followers, setFollowers ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ following, setFollowing ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ blocked, setBlocked ] = useState({ page: 1, items: [], totalCount: 0 })
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()

  const isOwnProfile = useMemo(() => user?.userId === userId, [user, userId])

  const loadData = useCallback(async (pages = {}) => {
    setServer(Response.loading)
    const params = new URLSearchParams({
      FollowersPage: pages.followers || 1,
      FollowingPage: pages.following || 1,
      BlockedPage: pages.blocked || 1,
      PageSize: PAGE_SIZE
    })
    try {
      const res = await fetch(`${BaseUrl.api}/users/user-relationships/${userId}?${params}`)
      if (res.ok) {
        const json = await res.json()
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
        if (isOwnProfile) {
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
        }
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId, isOwnProfile])

  const loadPage = useCallback((tab, page) => {
    const pages = { followers: tab === 'followers' ? page : followers.page, following: tab === 'following' ? page : following.page, blocked: tab === 'blocked' ? page : blocked.page }
    loadData(pages)
  }, [loadData])

  const handleRemoveFollower = useCallback(async (followerId) => {
    if (!user || !(await isValidSession())) {
      setServer(Response.forbidden)
      return
    }
    try {
      const jwt = await auth.getJwt()
      const res = await fetch(`${BaseUrl.api}/users/relationships/${user.userId}/${followerId}?Action=remove-follower`, {
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
      />

      <LoadingResponse visible={server.result <= 0} />
      <Popup
        visible={[403, 404, 500].includes(server.result)}
        message={server.message}
        onClose={() => { server.result === 403 ? router.replace('/login') : server.result === 404 ? router.back() : router.replace('/contact')}}
      />
    </View>
  )
}

export default Relationships