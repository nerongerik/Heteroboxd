import { StyleSheet, Text, View, Pressable, FlatList } from 'react-native'
import { useState, useMemo, useRef } from 'react'
import PaginationBar from '../paginationBar'
import { Colors } from '../../constants/colors'

const PAGE_SIZE = 20

const SearchTabs = ({ widescreen, router, onResponseChange }) => {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(0) //0 - init, 1 - searching, 2 - resting

  const [results, setResults] = useState({items: [], totalCount: 0, page: 1})

  const [activeTab, setActiveTab] = useState("films")
  const [showPagination, setShowPagination] = useState(false)
  const listRef = useRef(null)

  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const posterWidth = useMemo(() => widescreen ? 150 : 100, [widescreen])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const totalPages = Math.ceil(results.totalCount / PAGE_SIZE);

  const search = async (page) => {

  }

  const TabButton = ({ title, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </Pressable>
  );

  const Footer = () => (
    <PaginationBar
      page={results.page}
      totalPages={totalPages}
      visible={showPagination}
      onPagePress={(num) => {
        search(num)
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }}
    />
  );

  const RenderItem = ({item}) => {
    switch (activeTab) {
      case 'films':
        return RenderFilm(item)
      case 'celebrities':
        return RenderCeleb(item)
      case 'lists':
        return RenderList(item)
      case "users":
        return RenderUser(item)
      default:
        onResponseChange(400, 'You cannot search for that.')
        return null
    }
  }

  return (
    <>
      <View style={[widescreen ? styles.wideRow : styles.narrowRow]}>
        <TabButton title="Films" active={activeTab === "films"} onPress={() => setActiveTab("films")} />
        <TabButton title="Celebrities" active={activeTab === "celebrities"} onPress={() => setActiveTab("celebrities")} />
        <TabButton title="Lists" active={activeTab === "lists"} onPress={() => setActiveTab("lists")} />
        <TabButton title="Members" active={activeTab === "users"} onPress={() => setActiveTab("users")} />
      </View>

      <FlatList
        ref={listRef}
        data={results.items}
        key={activeTab}
        keyExtractor={(_, index) => `${activeTab}-${index}`}
        renderItem={RenderItem}
        ListEmptyComponent={
          searching === 2 && <Text style={{color: Colors.text, fontSize: 16, textAlign: 'center', padding: 50}}>Nothing to show here.</Text>
        }
        ListFooterComponent={Footer}
        style={{
          width: '100%',
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => setShowPagination(true)}
        onEndReachedThreshold={0.2}
      />
    </>
  )
}

export default SearchTabs

const styles = StyleSheet.create({
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    flex: 1,
  },
  tabText: {
    fontSize: 16,
    color: Colors.text,
  },
  activeTabText: {
    color: Colors.text_title,
    fontWeight: "bold",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: Colors.heteroboxd,
  },
  narrowRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: "space-between",
    width: '100%',
    marginBottom: 20,
  },
  wideRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
  },
})