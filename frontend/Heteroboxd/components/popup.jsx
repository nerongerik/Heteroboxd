import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native'
import { Colors } from '../constants/colors'

const Popup = ({ visible, message, onClose, confirm, onConfirm }) => {
  return (
    <Modal
      transparent={false}
      visible={visible}
      animationType="none"
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.message}>{message}</Text>
          {
            !confirm ? (
              <TouchableOpacity onPress={onClose} style={styles.button}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableOpacity>
            ) : (
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                <TouchableOpacity onPress={onConfirm} style={[styles.button, { backgroundColor: Colors.button_confirm, marginHorizontal: 10 }]}>
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: Colors.button_reject, marginHorizontal: 10 }]}>
                  <Text style={styles.buttonText}>No</Text>
                </TouchableOpacity>
              </View>
            )
          }
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
    padding: 15,
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
