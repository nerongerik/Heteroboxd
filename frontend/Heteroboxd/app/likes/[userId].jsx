import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import LikeTabs from '../../components/tabs/likeTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';

const UserLikes = () => {
  const {userId} = useLocalSearchParams();
  
  const [reviews, setReviews] = useState([])
  const [lists, setLists] = useState([])

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await fetch(`${BaseUrl.api}/users/user-likes/${userId}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
      if (res.status === 200) {
        const json = await res.json();
        setReviews(json['liked_reviews'])
        setLists(json['liked_lists'])
        setResult(200);
      } else if (res.status === 404) {
        setResult(404);
        setMessage('Data not found.');
      } else {
        setResult(500);
        setMessage('Something went wrong! Contact Heteroboxd support for more information!');
      }
    } catch {
      setResult(500);
      setMessage('Network error! Check your internet connection.');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [userId]);

  return (
    <View style={styles.container}>

      <LikeTabs
        reviews={reviews}
        lists={lists}
        onReviewPress={(reviewId) => router.push(`/review/${reviewId}`)}
        onListPress={(listId) => router.push(`/list/${listId}`)}
        refreshing={refreshing}
        onRefresh={loadData}
      />

      <Popup visible={result === 404 || result === 500} message={message} onClose={() => {
        result === 500 ? router.replace('/contact') : router.back();
      }}/>

      <LoadingResponse visible={refreshing} />

    </View>
  );
}

export default UserLikes

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})