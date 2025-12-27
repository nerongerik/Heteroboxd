import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Pressable } from "react-native";
import { Colors } from "../../constants/colors";
import {Headshot} from '../headshot';
import {Poster} from '../poster';
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CelebrityTabs = ({bio, starred, directed, wrote, produced, composed, onFilmPress, active, refreshing, onRefresh}) => {

  const [activeTab, setActiveTab] = useState(active);
  const { width } = useWindowDimensions();

  const seen = 0; //todo

  const getData = () => {
    switch (activeTab) {
      case "bio":
        return bio;
      case "starred":
        return starred;
      case "directed":
        return directed;
      case "wrote":
        return wrote;
      case "produced":
        return produced;
      case "composed":
        return composed;
      default:
        return [];
    }
  };

  const TabButton = ({ title, active, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
        <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  const Header = () => {
    if (activeTab === 'bio') return null;
    return (
      <>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: maxRowWidth}}>
          <View style={{padding: 5}}>
            <Text style={{color: Colors.text, fontSize: widescreen ? 16 : 13}}>{getData().length} films</Text>
          </View>
          <View style={{padding: 5, flexDirection: 'row', alignItems: 'center', 'justifyContent': 'center'}}>
            <MaterialCommunityIcons name="eye-outline" size={widescreen ? 20 : 16} color={Colors._heteroboxd} />
            <Text style={{color: Colors._heteroboxd, fontSize: widescreen ? 16 : 13}}> {seen}% seen</Text>
          </View>
        </View>
        <View style={{height: 20}} />
      </>
    )
  }

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
  }

  const widescreen = useMemo(() => width > 1000, [width]);
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen]);
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width]);
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing]);
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth]);

  const paddedEntries = useMemo(() => {
    if (activeTab === 'bio') return [];
    const padded = [...getData()];
    const remainder = padded.length % 4;
    if (remainder !== 0) {
      const placeholdersToAdd = 4 - remainder;
      for (let i = 0; i < placeholdersToAdd; i++) {
        padded.push(null);
      }
    }
    return padded;
  }, [activeTab, bio, starred, directed, wrote, produced, composed]);

  return (
    <View style={styles.container}>
      <View style={[widescreen && styles.tabRowWeb, !widescreen && styles.tabRowMobile]}>
        {bio && <TabButton title="Bio" active={activeTab === "bio"} onPress={() => setActiveTab("bio")} />}
        {starred?.length > 0 && <TabButton title="Acted" active={activeTab === "starred"} onPress={() => setActiveTab("starred")} />}
        {directed?.length > 0 && <TabButton title="Directed" active={activeTab === "directed"} onPress={() => setActiveTab("directed")} />}
        {produced?.length > 0 && <TabButton title="Produced" active={activeTab === "produced"} onPress={() => setActiveTab("produced")} />}
        {wrote?.length > 0 && <TabButton title="Wrote" active={activeTab === "wrote"} onPress={() => setActiveTab("wrote")} />}
        {composed?.length > 0 && <TabButton title="Composed" active={activeTab === "composed"} onPress={() => setActiveTab("composed")} />}
      </View>
      <FlatList
        data={paddedEntries}
        keyExtractor={(item, index) => item ? item.filmId.toString() : `placeholder-${index}`}
        ListHeaderComponent={Header}
        renderItem={Filmography}
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={{
          width: maxRowWidth,
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingHorizontal: spacing / 2,
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export default CelebrityTabs

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRowMobile: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: "space-between",
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
});