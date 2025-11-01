import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router';

const Profile = () => {

  const {userId} = useLocalSearchParams();

  return (
    <View>
      <Text>Profile</Text>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({})