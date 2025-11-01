import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/colors'
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Link style={styles.link} href='/about'>About Heteroboxd</Link>
      <Link style={styles.link} href='/notifications'>Notifications</Link>
      {
        !user ? (
          <Link style={styles.link} href='/login'>Profile</Link>
        ) : (
          <Link style={styles.link} href={`/profile/${user.userId}`}>Profile</Link>
        )
      }
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: "5%",
      paddingBottom: 50,
      backgroundColor: Colors.background,
  },
  link: {
    color: Colors.text_link,
    fontWeight: "600",
  },
})