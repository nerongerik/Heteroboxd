import { Pressable, StyleSheet, Text, View, ScrollView, Platform } from 'react-native'
import { useState } from 'react'
import { Colors } from '../constants/colors'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as format from '../helpers/format'
import { useCountries } from '../hooks/useCountries'

const FilterSort = ({context, currentFilter, onFilterChange, currentSort, onSortChange}) => {
  const [expandedFilter, setExpandedFilter] = useState(null)
  const countries = useCountries();

  const filterOptions = {
    explore: ['ALL', 'GENRE', 'YEAR', 'POPULAR', 'COUNTRY'],
    watchlist: ['ALL', 'GENRE', 'YEAR', 'COUNTRY'],
    userWatched: ['ALL', 'GENRE', 'YEAR', 'COUNTRY'],
    list: ['ALL'],
    celebrity: ['ALL'],
    userLists: ['ALL'],
    filmLists: ['ALL', 'FRIENDS'],
    userReviews: ['ALL'],
    filmReviews: ['ALL', 'FRIENDS']
  }

  const sortOptions = {
    explore: ['POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    watchlist: ['DATE ADDED', 'POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    userWatched: ['DATE WATCHED', 'POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    list: ['POSITION', 'DATE ADDED', 'POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    celebrity: ['POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'], 
    userLists: ['POPULARITY', 'DATE CREATED', 'SIZE'],
    filmLists: ['POPULARITY', 'DATE CREATED', 'SIZE'],
    userReviews: ['POPULARITY', 'DATE CREATED', 'RATING'],
    filmReviews: ['POPULARITY', 'DATE CREATED', 'RATING']
  }

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
    'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
    'TV Movie', 'Thriller', 'War', 'Western'
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({length: currentYear - 1888 + 1}, (_, i) => currentYear - i)

  const handleFilterSelect = (filterField) => {
    if (filterField === 'ALL' || filterField === 'POPULAR' || filterField === 'FRIENDS') {
      onFilterChange({field: filterField, value: null})
      setExpandedFilter(null)
    } else if (expandedFilter === filterField) {
      setExpandedFilter(null)
    } else {
      setExpandedFilter(filterField)
    }
  }

  const handleValueSelect = (filterField, value) => {
    onFilterChange({field: filterField, value: value})
    setExpandedFilter(null)
  }

  const handleSortSelect = (sortField) => {
    if (currentSort.field === sortField) {
      onSortChange({field: sortField, desc: !currentSort.desc})
    } else {
      onSortChange({field: sortField, desc: true})
    }
  }

  const getValueOptions = (filterField) => {
    switch(filterField) {
      case 'GENRE':
        return genres
      case 'YEAR':
        return years
      case 'COUNTRY':
        return countries // ← Already loaded
      default:
        return []
    }
  }

  const renderValueOption = (value, filterField) => {
    // For countries, render with flag
    if (filterField === 'COUNTRY') {
      const flagCode = format.formatCountry(value.code, Platform.OS === 'web' ? 'web' : 'native');
      
      if (Platform.OS === 'web' && flagCode) {
        return (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <img 
              src={`https://flagcdn.com/24x18/${flagCode}.png`}
              style={{ marginRight: 6, width: 20, height: 15 }}
              alt=""
            />
            <Text style={{fontSize: 12, color: Colors.text_title}}>{value.name}</Text>
          </View>
        );
      } else if (flagCode) {
        return (
          <Text style={{fontSize: 12, color: Colors.text_title}}>
            {flagCode} {value.name}
          </Text>
        );
      }
      return <Text style={{fontSize: 12, color: Colors.text_title}}>{value.name}</Text>;
    }
    
    // For other values (genre, year)
    return <Text style={{fontSize: 12, color: Colors.text_title}}>{value}</Text>;
  }

  const renderFilterButton = (item) => {
    const isSelected = currentFilter.field === item
    const isExpanded = expandedFilter === item
    const needsValue = ['GENRE', 'YEAR', 'COUNTRY'].includes(item)
    
    return (
      <View key={item}>
        <Pressable 
          onPress={() => handleFilterSelect(item)}
          style={[
            {paddingVertical: 12, paddingHorizontal: 5, marginVertical: 0},
          ]}
        >
          <View style={styles.filterRow}>
            <Text style={[
              {fontSize: 14, color: Colors.text, fontWeight: '500'},
              isSelected && {color: Colors.heteroboxd, paddingRight: 5}
            ]}>
              {item}
            </Text>
            {isSelected && currentFilter.value && (
              <Text style={{fontSize: 14, color: Colors.heteroboxd}}>
                ({currentFilter.value})
              </Text>
            )}
            {needsValue && (
              <Text style={{fontSize: 10, color: isSelected ? Colors.heteroboxd : Colors.text, paddingLeft: isSelected ? 5 : 10}}>
                {isExpanded ? '▲' : '▼'}
              </Text>
            )}
          </View>
        </Pressable>

        {isExpanded && needsValue && (
          <View style={{marginLeft: 20, marginRight: 20, marginTop: 5, marginBottom: 5, borderRadius: 5, borderWidth: 3, borderColor: Colors.border_color, maxHeight: 200}}>
            <ScrollView 
              style={{maxHeight: 200}}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {getValueOptions(item).map((value, index) => {
                const displayValue = item === 'COUNTRY' ? value.name : value.toString();
                const storedValue = item === 'COUNTRY' ? value.code : value.toString();
                const isValueSelected = isSelected && currentFilter.value === storedValue;
                
                return (
                  <Pressable
                    key={item === 'COUNTRY' ? value.code : value}
                    onPress={() => handleValueSelect(item, storedValue)}
                    style={[
                      {paddingVertical: 12, paddingHorizontal: 12}
                    ]}
                  >
                    <View style={[
                      isValueSelected && {color: Colors.heteroboxd}
                    ]}>
                      {renderValueOption(value, item)}
                    </View>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        )}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={{fontSize: 16, fontWeight: '600', color: Colors.text_title, marginVertical: 5}}>FILTERS</Text>
        {filterOptions[context].map((item) => renderFilterButton(item))}

        <Text style={{fontSize: 16, fontWeight: '600', color: Colors.text_title, marginVertical: 5}}>SORT</Text>
        {sortOptions[context].map((item) => {
          const isSelected = currentSort.field === item
          return (
            <Pressable 
              key={item}
              onPress={() => handleSortSelect(item)}
              style={[
                {paddingVertical: 12, paddingHorizontal: 5, marginVertical: 0},
              ]}
            >
              <View style={styles.sortRow}>
                <Text style={[
                  {fontSize: 14, color: Colors.text, fontWeight: '500'},
                  isSelected && {color: Colors.heteroboxd, paddingRight: 10}
                ]}>
                  {item}
                </Text>
                {isSelected && <MaterialCommunityIcons name={currentSort.desc ? "sort-descending" : "sort-ascending"} size={20} color={Colors.heteroboxd} />}
              </View>
            </Pressable>
          )
        })}
      </View>
      {
        context === 'filmReviews' && (
          <Text style={{textAlign: 'center', paddingHorizontal: 20, marginTop: -20, fontSize: 16, color: Colors.text_placeholder, fontStyle: 'italic', fontWeight: '600'}}>
            NOTE: Reviews flagged for violating community guidelines will appear on the bottom regardless of your filter/sort criteria.
          </Text>
        )
      }
    </ScrollView>
  )
}

export default FilterSort

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
})