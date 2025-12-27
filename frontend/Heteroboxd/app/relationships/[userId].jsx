import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import RelationshipTabs from '../../components/tabs/relationshipTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';

const Relationships = () => {

  const { userId, t } = useLocalSearchParams();
  const { user } = useAuth();

  const isOwnProfile = user && user.userId === userId;

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [blocked, setBlocked] = useState([]);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  async function loadData() {
    setRefreshing(true);
    setResult(0);
    try {
      const res = await fetch(`${BaseUrl.api}/users/user-relationships/${userId}`, {
        method: "GET",
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (res.status === 200) {
        const json = await res.json();
        setFollowers(json['followers'].map(uir => ({id: uir.id, name: uir.name, pictureUrl: uir.pictureUrl, tier: uir.tier, patron: uir.patron})));
        setFollowing(json['following'].map(uir => ({id: uir.id, name: uir.name, pictureUrl: uir.pictureUrl, tier: uir.tier, patron: uir.patron})));
        if (isOwnProfile) {
          setBlocked(json['blocked'].map(uir => ({id: uir.id, name: uir.name, pictureUrl: uir.pictureUrl, tier: uir.tier, patron: uir.patron})));
        }
        setResult(200);
      } else if (res.status === 404) {
        setResult(404);
        setMessage('User not found.');
      } else {
        setResult(500);
        setMessage('Something went wrong! Contact Heteroboxd support for more information!');
      }
    } catch {
      console.log('Failed to fetch relationships.');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [userId]);

  return (
    <View style={styles.container}>

      <RelationshipTabs
        isMyProfile={isOwnProfile}
        followers={followers}
        following={following}
        blocked={blocked}
        onUserPress={(u) => router.replace(`/profile/${u.id}`)}
        active={t}
        refreshing={refreshing}
        onRefresh={loadData}
      />

      <Popup visible={result === 404 || result === 500} message={message} onClose={() => {
        result === 500 ? router.replace('/contact') : router.back();
      }}/>

      <LoadingResponse visible={result === 0} />

    </View>
  );
}

export default Relationships

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
})