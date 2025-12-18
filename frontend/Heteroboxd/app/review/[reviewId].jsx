import { StyleSheet, Text, useWindowDimensions, View, ScrollView, Pressable, Platform } from 'react-native'
import { Colors } from '../../constants/colors'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { BaseUrl } from '../../constants/api'
import LoadingResponse from '../../components/loadingResponse'
import Popup from '../../components/popup'
import Stars from '../../components/stars'
import {Poster} from '../../components/poster'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as auth from '../../helpers/auth'
import ParsedRead from '../../components/parsedRead'
import Author from '../../components/author'

const Review = () => {
  const { reviewId } = useLocalSearchParams();
  const [review, setReview] = useState(null);
  const [iLiked, setILiked] = useState(false);
  const [likeCountLocalCopy, setLikeCountLocalCopy] = useState(0);
  
  const { user, isValidSession } = useAuth();

  const { width } = useWindowDimensions();

  const router = useRouter();
  const navigation = useNavigation();

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

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
          setMessage('This review no longer exists.');
          setResult(404);
          setReview({});
        } else {
          setMessage('Something went wrong! Contact Heteroboxd support for more information.');
          setResult(500);
          setReview({});
        }
      } catch {
        setMessage('Network error! Check your internet connection.');
        setResult(500);
        setReview({});
      }
    })();
  }, [reviewId]);

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
    navigation.setOptions({
      headerTitle: user?.userId === review?.authorId ? "Your review" : review?.authorName + "'s review",
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
    });
  }, [user, review]);

  function parseDate(date) {
    if (!date) return date;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nums = date.split(" ")[0].split("/");
    const day = nums[0]; const year = nums[2];
    const month = months[parseInt(nums[1] - 1)];
    return `Reviewed on ${month} ${day}, ${year}`;
  }

  const handleLike = async () => {
    const vS = await isValidSession();
    if (!user || !vS) return;
    try {
      const likeChange = iLiked ? -1 : 1
      setLikeCountLocalCopy(prev => prev + likeChange);
      setILiked(prev => !prev);
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/reviews/like-count/${reviewId}/${likeChange}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwt}`
        }
      });
      if (res.status !== 200) console.log("Update Review FAILED w/" + res.status);
      const uRes = await fetch(`${BaseUrl.api}/users/likes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({
          UserId: user.userId,
          ReviewId: reviewId,
          ListId: null
        })
      });
      if (uRes.status !== 200) console.log("Update User FAILED w/" + uRes.status);
    } catch {
      console.log("Network error.")
    }
  }

  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);

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
      <ScrollView
        contentContainerStyle={{
          padding: 5,
          paddingTop: 0,
          minWidth: widescreen ? 1000 : 'auto',
          maxWidth: widescreen ? 1000 : "100%",
          width: "100%",
          alignSelf: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={{paddingLeft: 3, fontWeight: "400", fontSize: widescreen ? 16 : 13, color: Colors.text, textAlign: "left",}}>{parseDate(review?.date)}</Text>
          </View>
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
        </View>
        {
          review?.text && review?.text.length > 0 ? (
            <ParsedRead html={review.text} />
          ) : (
            <View>
              <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'left'}}>{review?.authorName} wrote no review regarding this film.</Text>
            </View>
          )
        }
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5, justifyContent: 'space-between'}}>
          <Pressable onPress={handleLike} style={{flexDirection: 'row', alignItems: 'center'}}>
            { iLiked ? (
              <MaterialCommunityIcons style={{marginRight: 3}} name="cards-heart" size={widescreen ? 24 : 20} color={Colors.heteroboxd} />
            ) : (
              <MaterialCommunityIcons style={{marginRight: 3}} name="cards-heart-outline" size={widescreen ? 24 : 20} color={Colors.text} />
            )}
            <Text style={{color: Colors.text, fontSize: widescreen ? 18 : 14, fontWeight: 'bold'}}>{likeCountLocalCopy} likes</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LoadingResponse visible={result === 0} />
      <Popup visible={[404,500].includes(result)} message={message} onClose={() => {result === 404 ? router.replace(`/profile/${user?.userId}`) : router.replace(`/contact`)}}/>

    </View>
  )
}

export default Review;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 50
  },
})