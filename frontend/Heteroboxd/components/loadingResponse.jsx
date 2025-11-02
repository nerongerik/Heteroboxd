import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native'
import { Colors } from '../constants/colors'

const LoadingResponse = ({ visible }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <ActivityIndicator size={"large"} color={Colors.text_link} />
        </View>
      </View>
    </Modal>
  )
}

export default LoadingResponse

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '50%',
    backgroundColor: '(0,0,0,0)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  }
})
