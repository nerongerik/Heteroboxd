import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const PaginationBar = ({
  page,
  totalPages,
  onPagePress,
  visible,
  isLoading = false,
}) => {
  if (!visible || totalPages <= 1) {
    return null;
  }

  const getPages = () => {
    const pages = [];

    pages.push(1);

    const neighbors = [page - 1, page, page + 1].filter(
      p => p > 1 && p < totalPages
    );

    if (neighbors.length && neighbors[0] > 2) {
      pages.push('…');
    }

    neighbors.forEach(p => pages.push(p));

    if (
      neighbors.length &&
      neighbors[neighbors.length - 1] < totalPages - 1
    ) {
      pages.push('…');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <View style={styles.container}>
      {getPages().map((item, index) =>
        item === '…' ? (
          <Text key={`ellipsis-${index}`} style={styles.ellipsis}>
            …
          </Text>
        ) : (
          <Pressable
            key={item}
            disabled={isLoading}
            onPress={() => onPagePress(item)}
            style={[
              styles.page,
              item === page && styles.currentPage,
            ]}
          >
            <Text
              style={[
                styles.pageText,
                item === page && styles.currentPageText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        )
      )}
    </View>
  );
};

export default PaginationBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  page: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
  },
  currentPage: {
    backgroundColor: Colors.card,
  },
  pageText: {
    color: Colors.text,
    fontWeight: 'normal',
  },
  currentPageText: {
    fontWeight: 'bold',
    color: Colors.text_title
  },
  ellipsis: {
    marginHorizontal: 6,
    color: Colors.text,
  },
});
