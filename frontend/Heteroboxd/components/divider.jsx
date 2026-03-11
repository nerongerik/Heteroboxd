import { StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'

const Divider = ({ marginVertical }) => {
  return (
    <View
      style={{
        width: '75%',
        alignSelf: 'center',
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border_color,
        opacity: 0.5,
        marginVertical: marginVertical
      }}
    />
  )
}

export default Divider