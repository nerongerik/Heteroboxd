import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import CelebrityTabs from '../../components/tabs/celebrityTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';

const PAGE_SIZE = 20

const Celebrity = () => {

  const { celebrityId, t } = useLocalSearchParams();
  
  const [bio, setBio] = useState(null);
  const [starred, setStarred] = useState({ films: [], totalCount: 0, page: 1 });
  const [directed, setDirected] = useState({ films: [], totalCount: 0, page: 1 });
  const [wrote, setWrote] = useState({ films: [], totalCount: 0, page: 1 });
  const [produced, setProduced] = useState({ films: [], totalCount: 0, page: 1 });
  const [composed, setComposed] = useState({ films: [], totalCount: 0, page: 1 });

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  const loadData = async (pages = {}) => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams({
        StarredPage: pages.starred || 1,
        DirectedPage: pages.directed || 1,
        WrotePage: pages.wrote || 1,
        ProducedPage: pages.produced || 1,
        ComposedPage: pages.composed || 1,
        PageSize: PAGE_SIZE
      });
      
      const res = await fetch(`${BaseUrl.api}/celebrities/${celebrityId}?${params}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
      
      if (res.status === 200) {
        const json = await res.json();
        setBio(json.baseCeleb);
        setStarred({
          films: json.starred.films,
          totalCount: json.starred.totalCount,
          page: json.starred.page
        });
        setDirected({
          films: json.directed.films,
          totalCount: json.directed.totalCount,
          page: json.directed.page
        });
        setWrote({
          films: json.wrote.films,
          totalCount: json.wrote.totalCount,
          page: json.wrote.page
        });
        setProduced({
          films: json.produced.films,
          totalCount: json.produced.totalCount,
          page: json.produced.page
        });
        setComposed({
          films: json.composed.films,
          totalCount: json.composed.totalCount,
          page: json.composed.page
        });
        setResult(200);
      } else if (res.status === 404) {
        setResult(404);
        setMessage('Celebrity not found.');
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

  const loadPage = (tab, pageNumber) => {
    const pages = {
      starred: tab === 'starred' ? pageNumber : starred.page,
      directed: tab === 'directed' ? pageNumber : directed.page,
      wrote: tab === 'wrote' ? pageNumber : wrote.page,
      produced: tab === 'produced' ? pageNumber : produced.page,
      composed: tab === 'composed' ? pageNumber : composed.page
    };
    loadData(pages);
  };

  useEffect(() => {
    loadData();
  }, [celebrityId]);

  useEffect(() => {
    if (!bio) return;
    navigation.setOptions({
      headerTitle: bio.celebrityName,
      headerTitleAlign: 'center',
      headerTitleStyle: {color: Colors.text_title},
    });
  }, [bio]);

  return (
    <View style={styles.container}>

      <CelebrityTabs
        bio={{text: bio?.celebrityDescription, url: bio?.celebrityPictureUrl}}
        starred={starred}
        directed={directed}
        wrote={wrote}
        produced={produced}
        composed={composed}
        onFilmPress={(filmId) => router.push(`/film/${filmId}`)}
        onPageChange={loadPage}
        active={t}
        refreshing={refreshing}
        onRefresh={() => loadData()}
        pageSize={PAGE_SIZE}
      />

      <Popup visible={result === 404 || result === 500} message={message} onClose={() => {
        result === 500 ? router.replace('/contact') : router.back();
      }}/>

      <LoadingResponse visible={refreshing} />

    </View>
  );
}

export default Celebrity

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})