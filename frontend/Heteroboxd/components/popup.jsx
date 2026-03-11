import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/colors'

const Popup = ({ visible, message, onClose, confirm, onConfirm }) => {
  return (
    <Modal
      transparent={false}
      visible={visible}
      animationType='none'
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.message}>{message}</Text>
          {
            !confirm ? (
              <Pressable onPress={onClose} style={styles.button}>
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            ) : (
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                <Pressable onPress={onConfirm} style={[styles.button, { backgroundColor: Colors._heteroboxd, marginHorizontal: 10 }]}>
                  <Text style={styles.buttonText}>Yes</Text>
                </Pressable>
                <Pressable onPress={onClose} style={[styles.button, { backgroundColor: Colors.heteroboxd, marginHorizontal: 10 }]}>
                  <Text style={styles.buttonText}>No</Text>
                </Pressable>
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
    backgroundColor: Colors.heteroboxd,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: '600',
  },
})
