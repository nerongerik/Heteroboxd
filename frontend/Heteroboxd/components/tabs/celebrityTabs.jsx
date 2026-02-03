import { useState, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Pressable, ScrollView, RefreshControl } from "react-native";
import { Colors } from "../../constants/colors";
import {Headshot} from '../headshot';
import {Poster} from '../poster';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PaginationBar from '../paginationBar';

const CelebrityTabs = ({bio, starred, directed, wrote, produced, composed, onFilmPress, onPageChange,active, refreshing, onRefresh, pageSize}) => {
  const [activeTab, setActiveTab] = useState(active);
  const [showPagination, setShowPagination] = useState(false);
  const { width } = useWindowDimensions();
  const listRef = useRef(null);

  const seen = 0;

  const widescreen = useMemo(() => width > 1000, [width]);
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen]);
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width]);
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth]);
  const headshotWidth = useMemo(() => widescreen ? posterWidth - 20 : posterWidth + 20, [widescreen, posterWidth]);
  const headshotHeight = useMemo(() => headshotWidth * 3 / 2, [headshotWidth]);

  const currentData = useMemo(() => {
    switch (activeTab) {
      case "starred": return starred;
      case "directed": return directed;
      case "wrote": return wrote;
      case "produced": return produced;
      case "composed": return composed;
      default: return { films: [], totalCount: 0, page: 1 };
    }
  }, [activeTab, starred, directed, wrote, produced, composed]);

  const paddedEntries = useMemo(() => {
    if (activeTab === "bio") return [];
    const padded = [...currentData.films];
    const remainder = padded.length % 4;
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder;
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null);
      }
    }
    return padded;
  }, [currentData?.films, activeTab]);

  const totalPages = Math.ceil(currentData.totalCount / pageSize);

  const TabButton = ({ title, active, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabButton,
        {flex: widescreen ? 1 : null, paddingHorizontal: widescreen ? null : title === 'Bio' ? 15 : 10},
        active && styles.activeTabButton
      ]}
    >
      <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const Header = () => {
    if (activeTab === 'bio') return null;
    return (
      <>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: maxRowWidth}}>
          <View style={{padding: 5}}>
            <Text style={{color: Colors.text, fontSize: widescreen ? 16 : 13}}>{currentData.totalCount} films</Text>
          </View>
          <View style={{padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <MaterialCommunityIcons name="eye-outline" size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
            <Text style={{color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13}}> {seen}% seen</Text>
          </View>
        </View>
        <View style={{height: 20}} />
      </>
    );
  };

  const Footer = () => (
    <PaginationBar
      page={currentData.page}
      totalPages={totalPages}
      visible={showPagination}
      onPagePress={(num) => {
        onPageChange(activeTab, num);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      }}
    />
  );

  const Filmography = ({item}) => {
    if (!item) {
      return (
        <View
          style={{
            width: posterWidth,
            height: posterHeight,
            margin: spacing / 2,
          }}
        />
      );
    }
    return (
      <Pressable
        onPress={() => onFilmPress(item?.filmId)}
        style={{ margin: spacing / 2 }}
      >
        <Poster
          posterUrl={item.posterUrl}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: Colors.border_color,
          }}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[widescreen && styles.tabRowWeb, !widescreen && styles.tabRowMobile]}>
        {bio && <TabButton title="Bio" active={activeTab === "bio"} onPress={() => setActiveTab("bio")} />}
        {starred?.totalCount > 0 && <TabButton title="Acted" active={activeTab === "starred"} onPress={() => setActiveTab("starred")} />}
        {directed?.totalCount > 0 && <TabButton title="Directed" active={activeTab === "directed"} onPress={() => setActiveTab("directed")} />}
        {produced?.totalCount > 0 && <TabButton title="Produced" active={activeTab === "produced"} onPress={() => setActiveTab("produced")} />}
        {wrote?.totalCount > 0 && <TabButton title="Wrote" active={activeTab === "wrote"} onPress={() => setActiveTab("wrote")} />}
        {composed?.totalCount > 0 && <TabButton title="Composed" active={activeTab === "composed"} onPress={() => setActiveTab("composed")} />}
      </View>
      {activeTab === 'bio' && bio ? (
        <ScrollView style={{alignSelf: 'center', marginBottom: 50}} contentContainerStyle={{width: maxRowWidth, flexDirection: widescreen ? 'row' : 'column', justifyContent: 'flex-start'}} showsVerticalScrollIndicator={false}>
          <Headshot
            pictureUrl={bio.url}
            style={{
              width: headshotWidth,
              height: headshotHeight,
              borderWidth: 1,
              borderColor: Colors.border_color,
              borderRadius: 4,
              margin: widescreen ? 10 : 0,
              alignSelf: widescreen ? 'auto' : 'center'
            }}
          />
          <Text style={{textAlign: 'left', fontSize: widescreen ? 18 : 14, color: Colors.text, padding: 10}}>
            {bio.text}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={paddedEntries}
          key={activeTab}
          keyExtractor={(item, index) => item?.filmId ? `${activeTab}-${item.filmId}` : `${activeTab}-placeholder-${index}`}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          renderItem={Filmography}
          numColumns={4}
          columnWrapperStyle={{justifyContent: 'center'}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          style={{
            width: maxRowWidth,
            alignSelf: 'center'
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing / 2,
            paddingBottom: 80,
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => setShowPagination(true)}
          onEndReachedThreshold={0.2}
        />
      )}
    </View>
  );
};

export default CelebrityTabs

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRowMobile: {
    flexDirection: "row",
    paddingVertical: 5,
    justifyContent: "flex-start",
    width: '100%',
    marginBottom: 20,
  },
  tabRowWeb: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
    width: 1000,
    alignSelf: 'center'
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 15,
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
});