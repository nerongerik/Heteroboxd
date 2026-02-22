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
      <Link style={styles.link} href='/search'>Search</Link>
      <Link style={styles.link} href='/film/769'>Film</Link>
      <Link style={styles.link} href='/film/11'>Film w/ Collection</Link>
      <Link style={styles.link} href='/profile/019a699e-189a-72f3-a490-75efd46c1994'>Other User</Link>
      <Link style={styles.link} href='/notifications'>Notifs</Link>
      {
        !user ? (
          <Link style={styles.link} href='/login'>Profile</Link>
        ) : (
          <Link style={styles.link} href={`/profile/${user?.userId ?? null}`}>Profile</Link>
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