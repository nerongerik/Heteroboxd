import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import RelationshipTabs from '../../components/tabs/relationshipTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';
import * as auth from '../../helpers/auth';

const PAGE_SIZE = 50

const Relationships = () => {

  const { userId, t } = useLocalSearchParams();
  const { user, isValidSession } = useAuth();

  const isOwnProfile = user && user.userId === userId;

  const [followers, setFollowers] = useState({ items: [], totalCount: 0, page: 1 });
  const [following, setFollowing] = useState({ items: [], totalCount: 0, page: 1 });
  const [blocked, setBlocked] = useState({ items: [], totalCount: 0, page: 1 });

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  const loadData = async (pages = {}) => {
    setRefreshing(true);
    setResult(0);
    try {
      const params = new URLSearchParams({
        FollowersPage: pages.followers || 1,
        FollowingPage: pages.following || 1,
        BlockedPage: pages.blocked || 1,
        PageSize: PAGE_SIZE
      });

      const res = await fetch(`${BaseUrl.api}/users/user-relationships/${userId}?${params}`, {
        method: "GET",
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (res.status === 200) {
        const json = await res.json();
        setFollowers({
          items: json.followers.items.map(uir => ({
            id: uir.id, 
            name: uir.name, 
            pictureUrl: uir.pictureUrl, 
            tier: uir.tier, 
            patron: uir.patron
          })),
          totalCount: json.followers.totalCount,
          page: json.followers.page
        });
        setFollowing({
          items: json.following.items.map(uir => ({
            id: uir.id, 
            name: uir.name, 
            pictureUrl: uir.pictureUrl, 
            tier: uir.tier, 
            patron: uir.patron
          })),
          totalCount: json.following.totalCount,
          page: json.following.page
        });
        if (isOwnProfile) {
          setBlocked({
            items: json.blocked.items.map(uir => ({
              id: uir.id, 
              name: uir.name, 
              pictureUrl: uir.pictureUrl, 
              tier: uir.tier, 
              patron: uir.patron
            })),
            totalCount: json.blocked.totalCount,
            page: json.blocked.page
          });
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
  };

  const loadPage = (tab, pageNumber) => {
    const pages = {
      followers: tab === 'followers' ? pageNumber : followers.page,
      following: tab === 'following' ? pageNumber : following.page,
      blocked: tab === 'blocked' ? pageNumber : blocked.page
    };
    loadData(pages);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleRemoveFollower = async (followerId) => {
    const vS = await isValidSession();
    if (!user || !vS) router.replace('/login');
    try {
      const jwt = await auth.getJwt();
      const res = await fetch(`${BaseUrl.api}/users/relationships/${user.userId}/${followerId}?Action=remove-follower`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${jwt}`}
      });
      if (res.status === 200) {
        loadData();
      } else {
        router.replace('/contact');
      }
    } catch {
      router.replace('/contact');
    }
  }

  return (
    <View style={styles.container}>

      <RelationshipTabs
        isMyProfile={isOwnProfile}
        followers={followers}
        following={following}
        blocked={blocked}
        onUserPress={(uid) => router.push(`/profile/${uid}`)}
        onRemoveFollower={(followerId) => handleRemoveFollower(followerId)}
        onPageChange={loadPage}
        active={t}
        refreshing={refreshing}
        onRefresh={() => loadData()}
        pageSize={PAGE_SIZE}
      />

      <Popup visible={result === 404 || result === 500} message={message} onClose={() => {
        result === 500 ? router.replace('/contact') : router.back();
      }}/>

      <LoadingResponse visible={result === 0} />

    </View>
  );
}

export default Relationships;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
})