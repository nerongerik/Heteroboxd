import { Text, StyleSheet } from 'react-native'

const HText = (props) => {
  return (
    <Text style={[styles.defaultStyle, props.style]}>
      {props.children}
    </Text>
  )
}

const styles = StyleSheet.create({
  defaultStyle: {
    fontFamily: 'Inter_400Regular'
  },
})

export default HText
