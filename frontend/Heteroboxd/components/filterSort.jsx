import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native'
import { useState } from 'react'
import { Colors } from '../constants/colors'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const FilterSort = ({context, currentFilter, onFilterChange, currentSort, onSortChange}) => {
  const [expandedFilter, setExpandedFilter] = useState(null)

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

  //tMDB genre names
  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
    'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
    'TV Movie', 'Thriller', 'War', 'Western'
  ]

  //generate years from 1888 onward
  const currentYear = new Date().getFullYear()
  const years = Array.from({length: currentYear - 1888 + 1}, (_, i) => currentYear - i)

  //countries placeholder (for when we sync it from tmdb)
  const countries = [
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR",
    "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
    "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
    "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
    "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR",
    "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
    "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI",
    "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS",
    "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
    "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
    "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
    "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK",
    "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
    "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ",
    "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
    "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
    "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS",
    "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
    "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV",
    "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
    "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
    "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
  ].sort();

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
      default:
        return []
    }
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
              {getValueOptions(item).map((value) => {
                const isValueSelected = isSelected && currentFilter.value === value.toString()
                return (
                  <Pressable
                    key={value}
                    onPress={() => handleValueSelect(item, value.toString())}
                    style={[
                      {paddingVertical: 12, paddingHorizontal: 12}
                    ]}
                  >
                    <Text style={[
                      {fontSize: 12, color: Colors.text_title, fontWeight: '400'},
                      isValueSelected && {color: Colors.heteroboxd}
                    ]}>
                      {value}
                    </Text>
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
            NOTE: Reviews that have been flagged for breaking community guidelines by the AutoModerator will appear on the bottom regardless of your filter/sort criteria.
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