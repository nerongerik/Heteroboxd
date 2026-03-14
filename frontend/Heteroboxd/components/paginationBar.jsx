import { Pressable, StyleSheet, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from './htext'

const PaginationBar = ({page, totalPages, onPagePress }) => {
  const getPages = () => {
    const pages = []
    pages.push(1)
    const neighbors = [page - 1, page, page + 1].filter(p => p > 1 && p < totalPages)
    if (neighbors.length && neighbors[0] > 2) {
      pages.push('…')
    }
    neighbors.forEach(p => pages.push(p))
    if (neighbors.length && neighbors[neighbors.length - 1] < totalPages - 1) {
      pages.push('…')
    }
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12}}>
      {getPages().map((item, index) =>
        item === '…' ? (
          <HText key={`ellipsis-${index}`} style={styles.ellipsis}>
            …
          </HText>
        ) : (
          <Pressable key={item} onPress={() => onPagePress(item)} style={[styles.page, item === page && styles.currentPage]}>
            <HText style={[ styles.pageText, item === page && styles.currentPageText]}>{item}</HText>
          </Pressable>
        )
      )}
    </View>
  )
}

export default PaginationBar

const styles = StyleSheet.create({
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
  }
})