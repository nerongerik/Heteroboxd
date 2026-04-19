import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from './htext'

const Popup = ({ visible, message, onClose, confirm, onConfirm }) => {
  return (
    <Modal
      transparent={false}
      visible={visible}
      animationType='none'
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <HText style={styles.message}>
            {message === 'You have successfully joined the Heteroboxd community! We sent you a verification email needed to proceed.'
              ? <>
                  {'You have successfully joined the Heteroboxd community!\n'}
                  <HText style={{ fontWeight: 'bold', color: Colors.text_title }}>
                    We sent you a verification email needed to proceed.
                  </HText>
                  {`\n\n(If you don't see our message in your inbox, try checking your spam folder, too!)`}
                </>
              : message
            }
          </HText>
          {
            !confirm ? (
              <Pressable onPress={onClose} style={styles.button}>
                <HText style={styles.buttonText}>OK</HText>
              </Pressable>
            ) : (
              <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                <Pressable onPress={onConfirm} style={[styles.button, { backgroundColor: Colors._heteroboxd, marginHorizontal: 10 }]}>
                  <HText style={styles.buttonText}>Yes</HText>
                </Pressable>
                <Pressable onPress={onClose} style={[styles.button, { backgroundColor: Colors.heteroboxd, marginHorizontal: 10 }]}>
                  <HText style={styles.buttonText}>No</HText>
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
