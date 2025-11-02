import { StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const ProfileOptionsButton = ({userId}) => {

  const {user} = useAuth();

  function handlePress() {
    if (user.userId === userId) {
      //options to edit, delete, logout, or share account
      console.log('ja')
    } else {
      //options to block or report someone
      console.log('neki feget')
    }
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <MaterialIcons name="more-vert" size={24} color={Colors.text} />
    </TouchableOpacity>
  )
}

export default ProfileOptionsButton

const styles = StyleSheet.create({})