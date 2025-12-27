import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform, useWindowDimensions, Pressable } from "react-native";
import { Colors } from "../../constants/colors";
import {Headshot} from '../headshot';
import {Poster} from '../poster';

const CelebrityTabs = ({bio, starred, directed, wrote, produced, composed, onFilmPress, active, refreshing, onRefresh}) => {

  const [activeTab, setActiveTab] = useState(active);
  const { width } = useWindowDimensions()

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

  function TabButton({ title, active, onPress }) {
      return (
        <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
          <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
        </TouchableOpacity>
      );
    }

  return (
    <View style={styles.container}>
      <View style={[Platform.OS === 'web' && styles.tabRowWeb, Platform.OS !== 'web' && styles.tabRowMobile]}>
        {bio && <TabButton title="Bio" active={activeTab === "bio"} onPress={() => setActiveTab("bio")} />}
        {starred?.length > 0 && <TabButton title="Starred" active={activeTab === "starred"} onPress={() => setActiveTab("starred")} />}
        {directed?.length > 0 && <TabButton title="Directed" active={activeTab === "directed"} onPress={() => setActiveTab("directed")} />}
        {produced?.length > 0 && <TabButton title="Produced" active={activeTab === "produced"} onPress={() => setActiveTab("produced")} />}
        {wrote?.length > 0 && <TabButton title="Wrote" active={activeTab === "wrote"} onPress={() => setActiveTab("wrote")} />}
        {composed?.length > 0 && <TabButton title="Composed" active={activeTab === "composed"} onPress={() => setActiveTab("composed")} />}
      </View>

      <FlatList
        data={getData()}
        keyExtractor={(item) => item.filmId.toString()}
        renderItem={({ item }) => (
          <Pressable style={styles.filmRow} onPress={() => onFilmPress(item)}>
            {/*todo*/}
          </Pressable>
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={{
          width: Platform.OS === "web" ? Math.min(width, 1000) : "100%",
          alignSelf: Platform.OS === "web" ? "center" : "stretch",
          paddingHorizontal: 10,
        }}
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
  filmRow: {
    paddingVertical: 14,
    lineHeight: 30,
    paddingHorizontal: 5
  },
});