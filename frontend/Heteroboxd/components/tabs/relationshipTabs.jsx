import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { UserAvatar } from "../userAvatar";
import { Colors } from "../../constants/colors";

const RelationshipTabs = ({ isMyProfile, followers, following, blocked, onUserPress, active, refreshing, onRefresh }) => {

  const [activeTab, setActiveTab] = useState(active);
  const { width } = useWindowDimensions()

  const getData = () => {
    switch (activeTab) {
      case "followers":
        return followers;
      case "following":
        return following;
      case "blocked":
        return blocked;
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
        <TabButton title="Followers" active={activeTab === "followers"} onPress={() => setActiveTab("followers")} />
        <TabButton title="Following" active={activeTab === "following"} onPress={() => setActiveTab("following")} />

        {isMyProfile && (
          <TabButton title="Blocked" active={activeTab === "blocked"} onPress={() => setActiveTab("blocked")} />
        )}
      </View>

      <FlatList
        data={getData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userRow} onPress={() => onUserPress(item)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UserAvatar pictureUrl={item.pictureUrl} style={styles.picture} />
              <Text style={styles.username}>{item.name}</Text>
            </View>
          </TouchableOpacity>
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

export default RelationshipTabs

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
  userRow: {
    paddingVertical: 14,
    lineHeight: 30,
    paddingHorizontal: 5
  },
  username: {
    fontSize: 18,
    marginLeft: 10,
    color: Colors.text
  },
  picture: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderColor: Colors.border_color,
    borderWidth: 1.5,
  }
});
