import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { Colors } from '../constants/colors'
import { useMemo, useState } from 'react'
import SearchTabs from '../components/tabs/searchTabs'
import Popup from '../components/popup'
import { useRouter } from 'expo-router'

const Search = () => {
  const router = useRouter()

  const { width } = useWindowDimensions()
  const widescreen = useMemo(() => width > 1000, [width])
  
  const [response, setResponse] = useState(-1)
  const [message, setMessage] = useState('')

  return (
    <View style={styles.container}>
      <View style={{width: widescreen ? 1000 : width*0.95, marginTop: 10}}>
        <SearchTabs
          widescreen={widescreen}
          router={router}
          onResponseChange={(res, msg) => {
            setResponse(res)
            setMessage(msg)
          }}
        />
      </View>
      <Popup
        visible={![-1, 0, 200].includes(response)}
        message={message}
        onClose={response === 500 ? router.replace('/contact') : router.replace('/')}
      />
    </View>
  )
}

export default Search

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
})