import { StyleSheet, Text, ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

const Profile = () => {

  const {userId} = useLocalSearchParams();
  const {user} = useAuth();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ padding: "2%" }}
        showsVerticalScrollIndicator={false}
      >
        <Text>{user.name}</Text>
      </ScrollView>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: "5%",
    paddingBottom: 50,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
    color: Colors.text_title,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 0,
    color: Colors.text_title,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.text,
    textAlign: "justify",
  },
  link: {
    color: Colors.text_link,
    fontWeight: "500",
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
});