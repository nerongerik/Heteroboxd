import { StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import CelebrityTabs from '../../components/tabs/celebrityTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';

const Celebrity = () => {

  const { celebrityId, t } = useLocalSearchParams();
  
  const [bio, setBio] = useState(null)
  const [starred, setStarred] = useState([]);
  const [directed, setDirected] = useState([]);
  const [wrote, setWrote] = useState([]);
  const [produced, setProduced] = useState([]);
  const [composed, setComposed] = useState([]);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const navigation = useNavigation();

  async function loadData() {
    setRefreshing(true);
    try {
      const res = await fetch(`${BaseUrl.api}/celebrities/${celebrityId}`, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
      });
      if (res.status === 200) {
        const json = await res.json();
        setBio(json.baseCeleb);
        setStarred(json.starred);
        setDirected(json.directed);
        setWrote(json.wrote);
        setProduced(json.produced);
        setComposed(json.composed);
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
        bio={bio}
        starred={starred}
        directed={directed}
        wrote={wrote}
        produced={produced}
        composed={composed}
        onFilmPress={(filmId) => router.push(`/film/${filmId}`)}
        active={t}
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

export default Celebrity

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})