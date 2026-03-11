import { useMemo } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../constants/colors'
import SearchTabs from '../components/tabs/searchTabs'

const Search = () => {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const widescreen = useMemo(() => width > 1000, [width])

  return (
    <View style={{flex: 1, backgroundColor: Colors.background}}>
      <View style={{flex: 1, width: widescreen ? 1000 : width*0.95, marginTop: 10, alignSelf: 'center'}}>
        <SearchTabs widescreen={widescreen} router={router} />
      </View>
    </View>
  )
}

export default Search