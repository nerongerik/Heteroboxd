import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { BaseUrl } from '../../constants/api'
import { Colors } from '../../constants/colors'
import { Response } from '../../constants/response'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import LikeTabs from '../../components/tabs/likeTabs'

const PAGE_SIZE = 20

const UserLikes = () => {
  const { userId } = useLocalSearchParams()
  const [ reviews, setReviews ] = useState({ items: [], totalCount: 0, page: 1 })
  const [ lists, setLists ] = useState({ items: [], totalCount: 0, page: 1 })
  const [ server, setServer ] = useState(Response.initial)
  const router = useRouter()

  const loadData = useCallback(async (pages = {}) => {
    setServer(Response.loading)
    try {
      const params = new URLSearchParams({ ReviewsPage: pages.reviews || 1, ListsPage: pages.lists || 1, PageSize: PAGE_SIZE })
      const res = await fetch(`${BaseUrl.api}/users/user-likes/${userId}?${params}`)
      if (res.ok) {
        const json = await res.json()
        setReviews({ page: json.likedReviews.page, items: json.likedReviews.items, totalCount: json.likedReviews.totalCount })
        setLists({ page: json.likedLists.page, items: json.likedLists.items, totalCount: json.likedLists.totalCount })
        setServer(Response.ok)
      } else if (res.status === 404) {
        setServer(Response.notFound)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [userId])

  const loadPage = useCallback((tab, page) => {
    const pages = { reviews: tab === 'reviews' ? page : reviews.page, lists: tab === 'lists' ? page : lists.page }
    loadData(pages)
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [userId, loadData])

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <LikeTabs
        reviews={reviews}
        lists={lists}
        onPageChange={(tab, page) => loadPage(tab, page)}
        router={router}
        pageSize={PAGE_SIZE}
      />

      <LoadingResponse visible={server.result <= 0} />
      <Popup
        visible={[404, 500].includes(server.result)}
        message={server.message}
        onClose={() => { server.result === 404 ? router.back() : router.replace('/contact') }}
      />
    </View>
  )
}

export default UserLikes