import { useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Desc from '../assets/icons/desc.svg'
import Asc from '../assets/icons/asc.svg'
import * as format from '../helpers/format'
import { useCountries } from '../hooks/useCountries'
import { Colors } from '../constants/colors'
import HText from './htext'
import { useAuth } from '../hooks/useAuth'

const FilterSort = ({context, currentFilter, onFilterChange, currentSort, onSortChange}) => {
  const { user } = useAuth()
  const [ expandedFilter, setExpandedFilter ] = useState(null)
  const { countries } = useCountries()

  const filterOptions = {
    explore: ['ALL', 'GENRE', 'YEAR', 'POPULAR', 'COUNTRY'],
    watchlist: ['ALL', 'GENRE', 'YEAR', 'COUNTRY'],
    userWatched: ['ALL', 'GENRE', 'YEAR', 'COUNTRY'],
    list: [],
    celebrity: [],
    userLists: [],
    filmLists: user ? ['ALL', 'FRIENDS'] : [],
    exploreLists: user ? ['ALL', 'FRIENDS'] : [],
    userReviews: ['ALL', 'TEXT'],
    filmReviews: user ? ['ALL', 'FRIENDS', 'TEXT'] : []
  }

  const sortOptions = {
    explore: ['POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    watchlist: ['DATE ADDED', 'POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    userWatched: ['DATE WATCHED', 'POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    list: ['POSITION', 'POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'],
    celebrity: ['POPULARITY', 'LENGTH', 'RELEASE DATE', 'AVERAGE RATING'], 
    userLists: ['POPULARITY', 'DATE CREATED', 'SIZE'],
    filmLists: ['POPULARITY', 'DATE CREATED', 'SIZE'],
    exploreLists: ['POPULARITY', 'DATE CREATED', 'SIZE'],
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
  const years = Array.from({length: currentYear - 1894 + 1}, (_, i) => currentYear - i)

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
        return countries
      case 'TEXT':
        return ['Containing Text', 'Rating Only']
      default:
        return []
    }
  }

  const renderValueOption = (value, filterField) => {
    if (filterField === 'COUNTRY') {
      const flagCode = format.formatCountry(value.code, Platform.OS === 'web' ? 'web' : 'native')
      if (Platform.OS === 'web' && flagCode) {
        return (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <img 
              src={`https://flagcdn.com/24x18/${flagCode}.png`}
              style={{ marginRight: 6, width: 20, height: 15 }}
              alt=''
            />
            <HText style={{fontSize: 12, color: Colors.text_title}}>{value.name}</HText>
          </View>
        )
      } else if (flagCode) {
        return (
          <HText style={{fontSize: 12, color: Colors.text_title}}>
            {flagCode} {value.name}
          </HText>
        )
      }
      return <HText style={{fontSize: 12, color: Colors.text_title}}>{value.name}</HText>
    }
    return <HText style={{fontSize: 12, color: Colors.text_title}}>{value}</HText>
  }

  const renderFilterButton = (item) => {
    const isSelected = currentFilter.field === item
    const isExpanded = expandedFilter === item
    const needsValue = ['GENRE', 'YEAR', 'COUNTRY', 'TEXT'].includes(item)
    
    return (
      <View key={item}>
        <Pressable onPress={() => handleFilterSelect(item)} style={[{paddingVertical: 12, paddingHorizontal: 5, marginVertical: 0}]}>
          <View style={styles.filterRow}>
            <HText style={[
              {fontSize: 14, color: Colors.text, fontWeight: '500'},
              isSelected && {color: Colors.heteroboxd, paddingRight: 5}
            ]}>
              {item}
            </HText>
            {isSelected && currentFilter.value && (
              <HText style={{fontSize: 14, color: Colors.heteroboxd}}>
                ({currentFilter.value})
              </HText>
            )}
            {needsValue && (
              <HText style={{fontSize: 10, color: isSelected ? Colors.heteroboxd : Colors.text, paddingLeft: isSelected ? 5 : 10}}>
                {isExpanded ? '▲' : '▼'}
              </HText>
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
              {getValueOptions(item).map((value) => {
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
    <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        { filterOptions[context].length > 0 && (
          <>
            <HText style={{fontSize: 16, fontWeight: '600', color: Colors.text_title, marginVertical: 5}}>FILTERS</HText>
            {filterOptions[context].map((item) => renderFilterButton(item))}
          </>
        )
        }

        <HText style={{fontSize: 16, fontWeight: '600', color: Colors.text_title, marginVertical: 5}}>SORT</HText>
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
                <HText style={[
                  {fontSize: 14, color: Colors.text, fontWeight: '500'},
                  isSelected && {color: Colors.heteroboxd, paddingRight: 10}
                ]}>
                  {item}
                </HText>
                {
                  isSelected && (
                    currentSort.desc ? (
                      <Desc width={24} height={24} />
                    ) : (
                      <Asc width={24} height={24} />
                    )
                  )
                }
              </View>
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

export default FilterSort

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 35
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  }
})