import { StyleSheet, View, Animated, Pressable, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import CelebrityTabs from '../../components/tabs/celebrityTabs';
import Popup from '../../components/popup';
import LoadingResponse from '../../components/loadingResponse';
import { Colors } from '../../constants/colors';
import { BaseUrl } from '../../constants/api';
import SlidingMenu from '../../components/slidingMenu';
import FilterSort from '../../components/filterSort';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

const PAGE_SIZE = 24;

// Map frontend filter names to backend Role enum values
const FILTER_TO_ROLE_MAP = {
  'Starred': 'Actor',
  'Directed': 'Director',
  'Wrote': 'Writer',
  'Produced': 'Producer',
  'Composed': 'Composer',
};

// Map backend Role enum to frontend filter names
const ROLE_TO_FILTER_MAP = {
  'Actor': 'Starred',
  'Director': 'Directed',
  'Writer': 'Wrote',
  'Producer': 'Produced',
  'Composer': 'Composed',
};

const Celebrity = () => {
  const { user } = useAuth();

  const { celebrityId, t } = useLocalSearchParams();
  
  const [bio, setBio] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [currentTabData, setCurrentTabData] = useState({ films: [], totalCount: 0, page: 1 });
  const [seenFilms, setSeenFilms] = useState([]);
  const [seenCount, setSeenCount] = useState(0);

  const [fadeSeen, setFadeSeen] = useState(true);

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [currentFilter, setCurrentFilter] = useState('Bio');
  const [currentSort, setCurrentSort] = useState({ field: "RELEASE DATE", desc: true });

  const { width } = useWindowDimensions();

  const router = useRouter();
  const navigation = useNavigation();

  const [menuShown, setMenuShown] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  const openMenu = () => {
    setMenuShown(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown(false));
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const loadBio = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${BaseUrl.api}/celebrities/${celebrityId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (res.status === 200) {
        const json = await res.json();
        setBio(json);
        
        // Convert backend Role enum values to frontend filter names
        const frontendRoles = (json.roles || []).map(role => ROLE_TO_FILTER_MAP[role]).filter(Boolean);
        setAvailableRoles(frontendRoles);
        
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
  };

  const loadCredits = async (filter, pageNumber = 1) => {
    if (!filter || filter === 'Bio') {
      setCurrentTabData({ films: [], totalCount: 0, page: 1 });
      return;
    }

    // Convert frontend filter to backend Role enum
    const roleEnum = FILTER_TO_ROLE_MAP[filter];
    if (!roleEnum) {
      console.error(`Unknown filter: ${filter}`);
      return;
    }

    setRefreshing(true);
    try {
      const url = user
        ? `${BaseUrl.api}/celebrities/${celebrityId}/credits?UserId=${user.userId}&Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${roleEnum}&Sort=${currentSort.field}&Desc=${currentSort.desc}`
        : `${BaseUrl.api}/celebrities/${celebrityId}/credits?Page=${pageNumber}&PageSize=${PAGE_SIZE}&Filter=${roleEnum}&Sort=${currentSort.field}&Desc=${currentSort.desc}`
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (res.status === 200) {
        const json = await res.json();
        setCurrentTabData({
          films: json.items,
          totalCount: json.totalCount,
          page: json.page
        });
        setSeenFilms(json.seen)
        setSeenCount(json.seenCount)
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
  };

  const handleTabChange = (newTab) => {
    setCurrentFilter(newTab);
    if (newTab !== 'Bio') {
      loadCredits(newTab, 1);
    }
  };

  const handlePageChange = (pageNumber) => {
    loadCredits(currentFilter, pageNumber);
  };

  const handleRefresh = () => {
    if (currentFilter === 'Bio') {
      loadBio();
    } else {
      loadCredits(currentFilter, currentTabData.page);
    }
  };

  // Load bio on mount
  useEffect(() => {
    if (!bio) {
      loadBio();
    }
  }, []);

  // Set initial filter from URL param
  useEffect(() => {
    if (!t || t.length === 0) {
      setCurrentFilter("Bio");
    } else {
      // Normalize the URL param to match our filter names
      const normalizedParam = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
      
      // Check if it's a valid filter
      let filter = 'Bio';
      if (normalizedParam === 'Starred' || normalizedParam === 'Acted') {
        filter = 'Starred';
      } else if (FILTER_TO_ROLE_MAP[normalizedParam]) {
        filter = normalizedParam;
      }
      
      setCurrentFilter(filter);
      if (filter !== 'Bio') {
        loadCredits(filter, 1);
      }
    }
  }, [t]);

  // Reload when sort changes (only for non-Bio tabs)
  useEffect(() => {
    if (currentFilter && currentFilter !== 'Bio') {
      loadCredits(currentFilter, 1);
    }
  }, [currentSort]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: bio ? bio.celebrityName : '',
      headerTitleAlign: 'center',
      headerTitleStyle: { color: Colors.text_title },
      headerRight: () => (
        <Pressable onPress={openMenu} style={{ marginRight: widescreen ? 15 : null }}>
          <Ionicons name="options" size={24} color={Colors.text} />
        </Pressable>
      ),
    });
  }, [bio]);

  const widescreen = useMemo(() => width > 1000, [width]);

  return (
    <View style={styles.container}>
      <CelebrityTabs
        bio={{ text: bio?.celebrityDescription, url: bio?.celebrityPictureUrl }}
        currentTabData={currentTabData}
        availableRoles={availableRoles}
        activeTab={currentFilter}
        onTabChange={handleTabChange}
        onFilmPress={(filmId) => router.push(`/film/${filmId}`)}
        onPageChange={handlePageChange}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        pageSize={PAGE_SIZE}
        showSeen={user}
        flipShowSeen={() => setFadeSeen(prev => !prev)}
        seenFilms={seenFilms}
        seenCount={seenCount}
        fadeSeen={fadeSeen}
      />

      <Popup 
        visible={result === 404 || result === 500} 
        message={message} 
        onClose={() => {
          result === 500 ? router.replace('/contact') : router.back();
        }}
      />
      
      <LoadingResponse visible={refreshing} />

      <SlidingMenu 
        menuShown={menuShown} 
        closeMenu={closeMenu} 
        translateY={translateY}
        widescreen={widescreen}
        width={width}
      >
        <FilterSort
          key={`${currentFilter}-${currentSort.field}`}
          context={'celebrity'}
          currentFilter={currentFilter}
          onFilterChange={(newFilter) => {
            setCurrentFilter(newFilter);
            closeMenu();
          }}
          currentSort={currentSort}
          onSortChange={(newSort) => setCurrentSort(newSort)}
        />
      </SlidingMenu>
    </View>
  );
};

export default Celebrity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});