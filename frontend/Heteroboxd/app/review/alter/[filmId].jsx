import { Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View, TouchableOpacity } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as auth from '../../../helpers/auth';
import { BaseUrl } from '../../../constants/api';
import LoadingResponse from '../../../components/loadingResponse';
import Popup from '../../../components/popup';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';

const AlterReview = () => {
  const { filmId } = useLocalSearchParams();
  const { user, isValidSession } = useAuth();

  const [ reviewId, setReviewId ] = useState(null);
  const [ rating, setRating ] = useState(0);
  const [ text, setText ] = useState(null);
  const [ spoiler, setSpoiler ] = useState(false);

  const [ film, setFilm ] = useState(null);

  const { width, height } = useWindowDimensions();

  const router = useRouter();
  const navigation = useNavigation();

  const [ result, setResult ] = useState(-1);
  const [ message, setMessage ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BaseUrl.api}/films/${filmId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        if (res.status === 200) {
          const json = await res.json();
          setFilm({title: json.title, year: json.releaseYear, posterUrl: json.posterUrl});
        } else {
          setFilm({});
        }
      } catch {
        setFilm({});
      }
    })();
  }, [filmId]);

  useEffect(() => {
    (async () => {
      try {
        const vS = await isValidSession();
        if (!user || !vS) {
          router.replace(`/login`);
          return;
        }
        setResult(0);
        const jwt = await auth.getJwt();
        const res = await fetch(`${BaseUrl.api}/reviews/${user?.userId}/${filmId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        });
        if (res.status === 200) {
          const json = await res.json();
          setReviewId(json.id);
          setRating(json.rating);
          setText(json.text);
          setSpoiler(json.spoiler);
          setResult(200);
        } else if (res.status === 404) {
          setResult(404);
        } else {
          setMessage('Something went wrong! Contact Heteroboxd support for more information.');
          setResult(500);
        }
      } catch {
        setMessage('Network error! Check your internet connection.');
        setResult(500);
      }
    })();
  }, [user, filmId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSubmit}>
          <Ionicons name="checkmark" size={24} color={Colors.text_title} />
        </TouchableOpacity>
      )
    });
  }, [filmId, user, reviewId, rating, text, spoiler]);

  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);

  const handleSubmit = async () => {
    const vS = await isValidSession();
    if (!user || !vS) {
      setMessage('Session expired - try logging in again!');
      setResult(500);
    }
    setResult(0);
    try {
      const jwt = await auth.getJwt();
      let res;
      if (!reviewId) {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            Rating: rating,
            Text: text,
            Spoiler: spoiler,
            AuthorId: user?.userId,
            FilmId: filmId
          })
        });
        if (res.status === 200) {
          const json = await res.json();
          setResult(200);
          router.replace(`/review/${json.id}`);
        } else {
          setMessage('Something went wrong! Contact Heteroboxd support for more information.');
          setResult(500);
        }
      } else {
        res = await fetch(`${BaseUrl.api}/reviews`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            ReviewId: reviewId,
            Rating: rating,
            Text: text,
            Spoiler: spoiler,
          })
        });
        if (res.status === 200) {
          setResult(200);
          router.replace(`/review/${reviewId}`);
        } else {
          setMessage('Something went wrong! Contact Heteroboxd support for more information.');
          setResult(500);
        }
      }
    } catch {
      setMessage('Network error! Check your internet connection.');
      setResult(500);
    }
  }

  if (!film) {
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
        contentContainerStyle={{flexGrow: 1, width: widescreen ? 1000 : width*0.95, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
      >
        <Text>{reviewId}</Text>
        <Text>{rating}</Text>
        <Text>{text}</Text>
      </ScrollView>

      <LoadingResponse visible={result === 0} />
      <Popup visible={result === 500} message={message} onClose={() => router.replace('/contact')} />

    </View>
  )
}

export default AlterReview;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
    overflow: 'hidden',
  },
})