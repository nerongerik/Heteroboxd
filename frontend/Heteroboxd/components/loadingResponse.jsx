import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

const LoadingResponse = ({ visible }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
    >
      <View style={styles.overlay}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
        <View style={styles.popup}>
          <ActivityIndicator size="large" color={Colors.text_link} />
        </View>
      </View>
    </Modal>
  );
};

export default LoadingResponse;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
});