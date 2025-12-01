import { useLocalSearchParams, useRouter } from 'expo-router'
import { Platform, StyleSheet, useWindowDimensions, View, FlatList, Pressable, Text } from 'react-native'
import { Colors } from '../../constants/colors';
import { useEffect, useMemo, useState } from 'react';
import { BaseUrl } from '../../constants/api';
import LoadingResponse from '../../components/loadingResponse';
import Popup from '../../components/popup';
import PaginationBar from '../../components/paginationBar';
import { Poster } from '../../components/poster';

const List = () => {
  const { listId } = useLocalSearchParams();

  const router = useRouter();
  const { width } = useWindowDimensions();

  const [result, setResult] = useState(-1);
  const [message, setMessage] = useState('');

  const [baseList, setBaseList] = useState(null); //"header," basically just the list metadata without films

  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnd, setIsEnd] = useState(false);

  const loadBaseList = async () => {
    try {
      setResult(0);
      const res = await fetch(`${BaseUrl.api}/lists/${listId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      if (res.status === 200) {
        const json = await res.json();
        setBaseList(json);
        setResult(200);
      } else if (res.status === 404) {
        setResult(404);
        setMessage("This list no longer exists!");
      } else {
        setResult(500);
        setMessage("Something went wrong! Contact Heteroboxd support for more information!");
      }
    } catch {
      setResult(500);
      setMessage("Network error! Please check your internet connection.")
    }
  }

  const loadListPage = async (page, replace = false) => {
    if (!baseList) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${BaseUrl.api}/lists/entries/${baseList.id}?Page=${page}&PageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        }
      });
      if (res.status === 200) {
        const json = await res.json();
        setPage(json.page);
        setTotalCount(json.totalCount);
        setPageSize(json.pageSize);
        setEntries(prev =>
          replace ? json.entries : [...prev, ...json.entries]
        );
        if (json.entries.length < json.pageSize)
          setIsEnd(true);
      } else {
        setResult(500);
        setMessage("Something went wrong! Contact Heteroboxd support for more information!");
      }
    } catch {
      setResult(500);
      setMessage("Network error! Check your internet connection...");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBaseList();
  }, [listId]);

  useEffect(() => {
    setEntries([]);
    setIsEnd(false);
    loadListPage(1, true);
  }, [baseList]);

  //web on compooper?
  const widescreen = useMemo(() => Platform.OS === 'web' && width > 1000, [width]);
  //minimum spacing between posters
  const spacing = useMemo(() => widescreen ? 50 : 5, [widescreen]);
  //determine max usable row width:
  const maxRowWidth = useMemo(() => widescreen ? 1000 : width * 0.95, [widescreen]);
  //compute poster width:
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4)/4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3/2), [posterWidth]); //maintain 2:3 aspect

  return (
    <View>
      <Text>List</Text>
    </View>
  )
}

export default List

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 50,
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 0,
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
})