import { StyleSheet, Text, View, Platform, useWindowDimensions, FlatList, Pressable, RefreshControl } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Colors } from '../../../constants/colors'
import { BaseUrl } from '../../../constants/api'
import PaginationBar from '../../../components/paginationBar'
import LoadingResponse from '../../../components/loadingResponse'
import Popup from '../../../components/popup'
import Fontisto from '@expo/vector-icons/Fontisto'
import Author from '../../../components/author'
import Stars from '../../../components/stars'
import ParsedRead from '../../../components/parsedRead'
import {Poster} from '../../../components/poster'
import * as format from '../../../helpers/format'

const pageSize = 40 //user reviews display film posters unlike film reviews, so we need to decrease the page size

const UserReviews = () => {
  const { userId } = useLocalSearchParams()

  const navigation = useNavigation();
  const router = useRouter()
  const { width } = useWindowDimensions()


  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [authorPic, setAuthorPic] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorTier, setAuthorTier] = useState('')
  const [authorPatron, setAuthorPatron] = useState(false)

  const [showPagination, setShowPagination] = useState(false)

  const [result, setResult] = useState(-1)
  const [message, setMessage] = useState('')

  const loadReviewsPage = async (pageNumber) => {
    try {
      setIsLoading(true)

      const res = await fetch(`${BaseUrl.api}/reviews/user-reviews/${userId}?Page=${pageNumber}&PageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      })

      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setReviews(json.reviews)
        if (authorPic === '' || authorName === '' || authorTier === '') {
          setAuthorPic(json.reviews.length > 0 ? json.reviews[0].authorProfilePictureUrl : null)
          setAuthorName(json.reviews.length > 0 ? json.reviews[0].authorName : 'User')
          setAuthorTier(json.reviews.length > 0 ? json.reviews[0].authorTier : 'free')
          setAuthorPatron(json.reviews.length > 0 ? json.reviews[0].authorPatron : false)
        }
      } else if (res.status === 404) {
        setResult(404)
        setMessage("This user doesn't exist anymore!")
      } else {
        setResult(500)
        setMessage('Something went wrong! Contact Heteroboxd support.')
      }
    } catch {
      setResult(500)
      setMessage('Network error! Check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadReviewsPage(1)
  }, [userId])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${authorName}'s Reviews`,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
    });
  }, [reviews])

  const totalPages = Math.ceil(totalCount / pageSize)
  const widescreen = useMemo(
    () => Platform.OS === 'web' && width > 1000,
    [width]
  )
  const maxRowWidth = useMemo(
    () => (widescreen ? 900 : width * 0.95),
    [widescreen, width]
  )
  const posterWidth = useMemo(() => widescreen ? 150 : 100, [widescreen])
  const posterHeight = useMemo(() => posterWidth*3/2, [posterWidth])
  const AuthorMemo = useMemo(() =>
    <Author
      userId={userId}
      url={authorPic}
      username={authorName}
      tier={authorTier}
      patron={authorPatron}
      router={router}
      widescreen={widescreen}
    />,
  [userId, authorPic, authorName, authorTier, authorPatron, router, widescreen])

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { marginBottom: 10 }]}>
            <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              {AuthorMemo}
              <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
            </View>
            <Pressable onPress={() => router.push(`/review/${item.id}`)}>
              <Text style={{padding: 5, flex: 1, flexWrap: 'wrap', fontWeight: '600', textAlign: 'left', fontSize: widescreen ? 20 : 16, color: Colors.text_title}}>{item.filmTitle}</Text>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                <View style={{width: posterWidth, height: posterHeight, marginRight: 5}}>
                  <Poster
                    posterUrl={item.filmPosterUrl}
                    style={{
                      width: posterWidth,
                      height: posterHeight,
                      borderWidth: 2,
                      borderRadius: 6,
                      borderColor: Colors.border_color
                    }}
                  />
                </View>
                {
                  item.text && item.text.length > 0 ?
                    <View style={{width: maxRowWidth - posterWidth - 10, maxHeight: posterHeight, overflow: 'hidden'}}>
                      <ParsedRead html={`${item.text.replace(/\n{2,}/g, '\n').trim().slice(0, 200)}${item.text.length > 200 ? '...' : ''}`} />
                    </View>
                  :
                    <View style={{width: maxRowWidth - posterWidth - 10, marginLeft: -5}}>
                      <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center'}}>{authorName} wrote no review regarding this film.</Text>
                    </View>
                }
              </View>
              <View style={styles.statsRow}>
                <Fontisto name="heart" size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
                <Text style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</Text>
              </View>
            </Pressable>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadReviewsPage(page)}
          />
        }
        contentContainerStyle={{
          width: maxRowWidth,
          paddingBottom: 80,
          marginTop: 40,
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        visible={showPagination}
        onPagePress={(num) => {
          setPage(num)
          loadReviewsPage(num)
        }}
      />

      <LoadingResponse visible={isLoading} />
      <Popup
        visible={[401, 404, 500].includes(result)}
        message={message}
        onClose={() =>
          result === 500 ? router.replace('/contact') : router.replace('/')
        }
      />
    </View>
  )
}

export default UserReviews

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50,
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