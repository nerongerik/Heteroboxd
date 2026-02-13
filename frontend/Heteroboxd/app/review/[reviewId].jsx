import { StyleSheet, Text, useWindowDimensions, View, FlatList, Pressable, Platform, ActivityIndicator } from 'react-native'
import { Colors } from '../../constants/colors'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { BaseUrl } from '../../constants/api'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import Stars from '../../components/stars'
import {Poster} from '../../components/poster'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as auth from '../../helpers/auth'
import * as format from '../../helpers/format'
import ParsedRead from '../../components/parsedRead'
import Author from '../../components/author'
import { Ionicons } from '@expo/vector-icons'
import PaginationBar from '../../components/paginationBar'
import { Snackbar } from 'react-native-paper'
import CommentInput from '../../components/commentInput'
import ReviewOptionsButton from '../../components/optionButtons/reviewOptionsButton'
import { MaterialIcons } from '@expo/vector-icons'
import { Octicons } from '@expo/vector-icons'

const ReviewWithComments = () => {
  const { reviewId } = useLocalSearchParams();
  const [review, setReview] = useState(null);
  const [iLiked, setILiked] = useState(false);
  const [likeCountLocalCopy, setLikeCountLocalCopy] = useState(0);
  const [showText, setShowText] = useState(true);
  
  const { user, isValidSession } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const navigation = useNavigation();

  const [comments, setComments] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showPagination, setShowPagination] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [message, setMessage] = useState('');
  const [snack, setSnack] = useState(false);

  const [result, setResult] = useState(-1);
  const [reviewMessage, setReviewMessage] = useState('');

  const flatListRef = useRef(null);

  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  const maxRowWidth = useMemo(() => (widescreen ? 900 : '95%'), [widescreen]);
  const spacing = useMemo(() => (widescreen ? 10 : 5), [widescreen]);

  useEffect(() => {
    (async () => {
      try {
        setResult(0);
        const res = await fetch(`${BaseUrl.api}/reviews/${reviewId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (res.status === 200) {
          const json = await res.json();
          setReview(json);
          setLikeCountLocalCopy(json.likeCount);
          setResult(200);
        } else if (res.status === 404) {
          setReviewMessage('This review no longer exists.');
          setResult(404);
          setReview({});
        } else {
          setReviewMessage('Something went wrong! Contact Heteroboxd support for more information.');
          setResult(500);
          setReview({});
        }
      } catch {
        setReviewMessage('Network error! Check your internet connection.');
        setResult(500);
        setReview({});
      }
    })();
  }, [reviewId]);

  const loadCommentsPage = async (pageNumber) => {
    try {
      setIsLoadingComments(true)
      const res = await fetch(`${BaseUrl.api}/comments/review/${reviewId}?Page=${pageNumber}&PageSize=${40}`, {
        method: 'GET',
        headers: {Accept: 'application/json'}
      })
      if (res.status === 200) {
        const json = await res.json()
        setPage(json.page)
        setTotalCount(json.totalCount)
        setComments(json.items)
      } else if (res.status === 404) {
        setMessage("This review doesn't exist anymore!");
        setComments([]);
        setSnack(true);
      } else {
        setComments([]);
      }
    } catch {
      setMessage("Something went wrong! Contact Heteroboxd support for more information.");
      setComments([]);
      setSnack(true);
    } finally {
      setIsLoadingComments(false)
    }
  }

  useEffect(() => {
    setPage(1);
    loadCommentsPage(1);
  }, [reviewId]);

  useEffect(() => {
    (async () => {
      if (review?.spoiler) {
        if (review.authorId !== user?.userId) {
          setShowText(false);
          const jwt = await auth.getJwt();
          const res = await fetch(`${BaseUrl.api}/users/uwf/${user.userId}/${review.filmId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${jwt}`
            }
          });
          if (res.status === 200) {
            setShowText(true);
          }
        }
      }
    })();
  }, [review]);

  useEffect(() => {
    (async () => {
      const vS = await isValidSession();
      if (!user || !vS) return;
      try {
        const jwt = await auth.getJwt();
        const res = await fetch(`${BaseUrl.api}/users/${user.userId}/liked/${reviewId}?ObjectType=review`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        });
        if (res.status === 200) {
          const json = await res.json();
          setILiked(json);
        } else {
          console.log('Is Review Liked FAILED: ' + res.status);
        }
      } catch {
        console.log('Network error');
      }
    })();
  }, [reviewId]);

  useEffect(() => {
    if (!review) return;
    navigation.setOptions({
      headerTitle: user?.userId === review.authorId ? "Your review" : review.authorName + "'s review",
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
      headerRight: () => user ? <ReviewOptionsButton reviewId={review.id} /> : null
    });
  }, [user, review]);

  const handleLike = async () => {
    const vS = await isValidSession();
    if (!user || !vS) return;
    try {
      const likeChange = iLiked ? -1 : 1
      setLikeCountLocalCopy(prev => prev + likeChange);
      setILiked(prev => !prev);
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/reviews/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'UserId': user.userId,
          'UserName': user.name,
          'AuthorId': review?.authorId,
          'ReviewId': reviewId,
          'FilmTitle': review?.filmTitle,
          'ListId': null,
          'ListName': null,
          'LikeChange': likeChange
        })
      })
      if (res.status !== 200) console.log('failed to send like request for this review');
    } catch {
      console.log("Network error.")
    }
  }

  const handleCreate = useCallback(async (commentText) => {
    try {
      const vS = await isValidSession();
      if (!user || !vS) router.replace('/login');
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          'Text': commentText,
          'AuthorId': user.userId,
          'AuthorName': user.name,
          'ReviewId': reviewId,
          'FilmTitle': review?.filmTitle
        })
      });
      if (res.status === 200) {
        loadCommentsPage(Math.ceil(totalCount / 40));
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      } else {
        setMessage(`${res.status}: Failed to add comment! Try reloading Heteroboxd.`);
        setSnack(true);
      }
    } catch {
      setMessage(`Network error! Check your internet connection.`);
      setSnack(true);
    }
  }, [user, isValidSession, router, reviewId, totalCount, review]);

  const handleDelete = async (commentId) => {
    try {
      const vS = await isValidSession();
      if (!user || !vS) {
        setMessage("Session expired! Try logging in again.");
        setSnack(true);  
      }
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${jwt}`}
      });
      if (res.status === 200) {
        setMessage("Comment deleted.");
        setSnack(true);
        loadCommentsPage(page);
      } else {
        setMessage(`${res.status}: Failed to delete comment! Try reloading Heteroboxd.`);
        setSnack(true);
      }
    } catch {
      setMessage("Network error! Check your internet connection.");
      setSnack(true);
    }
  };

  const handleReport = async (commentId) => {
    try {
      const vS = await isValidSession();
      if (!user || !vS) {
        setMessage("Session expired! Try logging in again.");
        setSnack(true);  
      }
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/comments/report/${commentId}`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${jwt}`}
      });
      if (res.status === 200) {
        setMessage("Comment reported.");
        setSnack(true);
      } else {
        setMessage(`${res.status}: Failed to report comment! Try reloading Heteroboxd.`);
        setSnack(true);
      }
    } catch {
      setMessage("Network error! Check your internet connection.");
      setSnack(true);
    }
  };

  const renderReviewHeader = () => (
    <View style={{
      padding: 5,
      paddingTop: 0,
      minWidth: widescreen ? 1000 : 'auto',
      maxWidth: widescreen ? 1000 : "100%",
      width: "100%",
      alignSelf: "center",
    }}>
      <View style={{marginBottom: -5}}>
        <Author
          userId={review?.authorId}
          url={review?.authorProfilePictureUrl}
          username={review?.authorName}
          tier={review?.authorTier}
          patron={review?.authorPatron}
          router={router}
          widescreen={widescreen}
        />
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignSelf: 'center'}}>
        <View style={{flex: 1, justifyContent: 'space-around'}}>
          <Text style={{paddingLeft: 3, color: Colors.text_title, fontWeight: '500', fontSize: widescreen ? 24 : 20, textAlign: 'left', flexShrink: 1}}>
            {review?.filmTitle}
          </Text>
          <Stars size={widescreen ? 40 : 30} rating={review?.rating ?? 0} readonly={true} padding={false} align={'flex-start'} />
          <Text style={{paddingLeft: 3, fontWeight: "400", fontSize: widescreen ? 16 : 13, color: Colors.text, textAlign: "left",}}>{`Reviewed on ${format.parseDate(review?.date)}`}</Text>
        </View>
        <Pressable onPress={() => router.push(`/film/${review?.filmId}`)}>
          <Poster
            posterUrl={review?.filmPosterUrl}
            style={{
              width: widescreen ? 150 : 100,
              height: widescreen ? 150*3/2 : 100*3/2,
              borderWidth: 2,
              borderRadius: 4,
              marginRight: 5,
              borderColor: Colors.border_color
            }}
          />
        </Pressable>
      </View>
      {
        review?.text && review?.text.length > 0 ? (
          showText ?
            <ParsedRead html={review.text} />
          : (
            <Pressable onPress={() => setShowText(true)}>
              <View style={{width: widescreen ? 750 : '95%', alignSelf: 'center', padding: 25, backgroundColor: Colors.card, borderRadius: 8, borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.border_color, marginVertical: 10, alignItems: 'center', justifyContent: 'center'}}>
                <Ionicons name="warning-outline" size={widescreen ? 30 : 24} color={Colors.text} />
                <Text style={{color: Colors.text, fontSize: 16, textAlign: 'center'}}>This review contains spoilers.<Text style={{color: Colors.text_link}}> Read anyway?</Text></Text>
              </View>
            </Pressable>
          )
          
        ) : (
          <View>
            <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'left'}}>{review?.authorName} wrote no review regarding this film.</Text>
          </View>
        )
      }
      <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between'}}>
        <Pressable onPress={handleLike} style={{flexDirection: 'row', alignItems: 'center'}}>
          { iLiked ? (
            <MaterialCommunityIcons style={{marginRight: 3}} name="cards-heart" size={widescreen ? 24 : 20} color={Colors.heteroboxd} />
          ) : (
            <MaterialCommunityIcons style={{marginRight: 3}} name="cards-heart-outline" size={widescreen ? 24 : 20} color={Colors.text} />
          )}
          <Text style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: 'bold'}}>{format.formatCount(likeCountLocalCopy)} likes</Text>
        </Pressable>
      </View>
      
      <View style={[styles.divider, {marginVertical: 10}]} />

      {user && (
        <CommentInput
          onSubmit={handleCreate}
          widescreen={widescreen}
          maxRowWidth={maxRowWidth}
          user={user}
        />
      )}

      <Text style={{
        color: Colors.text_title,
        fontSize: widescreen ? 20 : 18,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingLeft: 5
      }}>
        Comments ({totalCount})
      </Text>
    </View>
  );

  const renderCommentItem = ({ item }) => (
    <View style={{width: maxRowWidth, alignSelf: 'center'}}>
      <View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View style={{marginLeft: 10}}>
            <Author
              userId={item.authorId}
              url={item.authorProfilePictureUrl}
              username={item.authorName}
              tier={item.authorTier}
              patron={item.authorPatron}
              router={router}
              widescreen={widescreen}
            />
          </View>
          {
            user ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginRight: 20}}>
                {
                  user.tier.toLowerCase() !== 'admin' && user.userId !== item.authorId && (
                    <Pressable onPress={() => handleReport(item.id)}>
                      <Octicons name="report" size={widescreen ? 22 : 18} color={Colors.text} />
                    </Pressable>
                  )
                }
                {
                  user.tier.toLowerCase() === 'admin' || user.userId === item.authorId && (
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <MaterialIcons name="delete-forever" size={widescreen ? 24 : 20} color={Colors.text} />
                    </Pressable>
                  )
                }
              </View>
            ) : null
          }
        </View>
        <View style={{padding: 10}}>
          <ParsedRead html={`${item.text.replace(/\n{3,}/g, '\n\n').trim()}`} />
        </View>
      </View>
      <View style={[styles.divider, {marginVertical: spacing}]} />
    </View>
  );

  const renderEmptyComments = () => (
    <View style={{width: maxRowWidth, height: 200, alignSelf: 'center', justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{color: Colors.text, fontSize: widescreen ? 20 : 16, textAlign: 'center'}}>No comments yet. Be the first to respond!</Text>
    </View>
  );

  const renderFooter = () => {
    if (comments && comments.length === 0) return null;
    
    return (
      <View style={{paddingBottom: 100}}>
        {isLoadingComments && (
          <View style={{padding: 20}}>
            <ActivityIndicator size="large" color={Colors.text_link} />
          </View>
        )}
        <PaginationBar
          page={page}
          totalPages={Math.ceil(totalCount / 40)}
          visible={showPagination}
          onPagePress={(num) => {
            setComments(null);
            setPage(num)
            loadCommentsPage(num)
          }}
        />
      </View>
    );
  };

  if (!review) {
    return (
      <View style={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 5,
        backgroundColor: Colors.background,
      }}>
        <LoadingResponse visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderReviewHeader}
        renderItem={renderCommentItem}
        ListEmptyComponent={renderEmptyComments}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 100,
        }}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />

      <LoadingResponse visible={result === 0} />
      <Popup 
        visible={[404,500].includes(result)} 
        message={reviewMessage} 
        onClose={() => {
          result === 404 ? router.replace(`/profile/${user?.userId}`) : router.replace(`/contact`)
        }}
      />

      <Snackbar
        visible={snack}
        onDismiss={() => setSnack(false)}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? '50%' : '90%',
          alignSelf: 'center',
          borderRadius: 8
        }}
        action={{
          label: 'OK',
          onPress: () => setSnack(false),
          textColor: Colors.text_link,
        }}
      >
        {message}
      </Snackbar>

    </View>
  )
}

export default ReviewWithComments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  divider: {
    width: "95%",
    alignSelf: "center",
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border_color,
  },
})