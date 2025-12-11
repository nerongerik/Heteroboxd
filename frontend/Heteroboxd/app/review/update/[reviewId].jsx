import { StyleSheet, Text, View } from 'react-native'

const UpdateReview = ({route}) => {
  const {item} = route.params;
  const review = JSON.parse(item);
  return (
    <View>
      <Text>UpdateReview</Text>
    </View>
  )
}

export default UpdateReview

const styles = StyleSheet.create({})