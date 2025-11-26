import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/colors';

const PaginationBar = ({ numbers, page, onPagePress }) => {
  return (
    <View style={styles.paginationContainer}>
      {numbers.map(num => (
        <Text
          key={num}
          onPress={() => onPagePress(num)}
          style={[
            styles.pageNumber,
            num === page && styles.activePageNumber
          ]}
        >
          {num}
        </Text>
      ))}
    </View>
  );
};

export default PaginationBar;

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    marginTop: 25,
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  pageNumber: {
    padding: 10,
    margin: 5,
    backgroundColor: Colors.card,
    color: Colors.text,
    borderRadius: 6
  },
  activePageNumber: {
    backgroundColor: Colors.primary,
    color: 'white'
  }
});
