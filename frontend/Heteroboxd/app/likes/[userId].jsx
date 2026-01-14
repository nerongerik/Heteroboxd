import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import LikeTabs from '../../components/tabs/likeTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';

const PAGE_SIZE = 32

const UserLikes = () => {
  const {userId} = useLocalSearchParams();
  
  const [reviews, setReviews] = useState({ items: [], totalCount: 0, page: 1 });
  const [lists, setLists] = useState({ items: [], totalCount: 0, page: 1 });

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  const loadData = async (pages = {}) => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        ReviewsPage: pages.reviews || 1,
        ListsPage: pages.lists || 1,
        PageSize: PAGE_SIZE
      });
      
      const res = await fetch(`${BaseUrl.api}/users/user-likes/${userId}?${params}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
      
      if (res.status === 200) {
        const json = await res.json();
        setReviews({
          items: json.likedReviews.items,
          totalCount: json.likedReviews.totalCount,
          page: json.likedReviews.page
        });
        setLists({
          items: json.likedLists.items,
          totalCount: json.likedLists.totalCount,
          page: json.likedLists.page
        });
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
  };

  const loadPage = (tab, pageNumber) => {
    const pages = {
      reviews: tab === 'reviews' ? pageNumber : reviews.page,
      lists: tab === 'lists' ? pageNumber : lists.page
    };
    loadData(pages);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  return (
    <View style={styles.container}>

      <LikeTabs
        reviews={reviews}
        lists={lists}
        refreshing={refreshing}
        onRefresh={() => loadData()}
        onPageChange={loadPage}
        router={router}
        pageSize={PAGE_SIZE}
      />

      <Popup visible={result === 404 || result === 500} message={message} onClose={() => {
        result === 500 ? router.replace('/contact') : router.back();
      }}/>

      <LoadingResponse visible={refreshing} />

    </View>
  );
}

export default UserLikes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})