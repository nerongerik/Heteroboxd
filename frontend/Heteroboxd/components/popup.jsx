import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native'
import { Colors } from '../constants/Colors'

const Popup = ({ visible, message, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default Popup

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '80%',
    backgroundColor: Colors.background,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.button,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: '600',
  },
})
