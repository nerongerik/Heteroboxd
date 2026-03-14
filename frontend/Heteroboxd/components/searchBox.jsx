import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { KeyboardAvoidingView, StyleSheet, TextInput, View, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native'
import { Colors } from '../constants/colors'
import { Snackbar } from 'react-native-paper'
import { BaseUrl } from '../constants/api'
import Fontisto from '@expo/vector-icons/Fontisto'
import {Response} from '../constants/response'

const SearchBox = ({ onSelected, page, pageSize }) => {
  const [ query, setQuery ] = useState('')
  const lastQuery = useRef('')
  const [ server, setServer ] = useState(Response.initial)
  const { width } = useWindowDimensions()

  useEffect(() => {
    if (lastQuery.current) handleSearch()
  }, [page])

  const handleSearch = useCallback(async (overridePage) => {
    const q = lastQuery.current || query
    if (q?.length === 0) {
      return
    }
    setServer(Response.loading)
    try {
      const res = await fetch(`${BaseUrl.api}/films/search?Search=${q}&Page=${overridePage || page}&PageSize=${pageSize}`)
      if (res.ok) {
        const json = await res.json()
        onSelected({ items: json.items, totalCount: json.totalCount, page: json.page })
        setServer(Response.ok)
      } else {
        setServer(Response.internalServerError)
      }
    } catch {
      setServer(Response.networkError)
    }
  }, [lastQuery, query, page, pageSize, onSelected])

  const widescreen = useMemo((() => width > 1000), [width])

  return (
    <View keyboardShouldPersistTaps='handled'>
      <>
        <KeyboardAvoidingView style={{flexDirection: 'row', alignSelf: 'center', justifyContent: 'center', width: widescreen ? 750 : width*0.75, marginTop: 20, marginBottom: 30}}>
          <TextInput
            style={[styles.input, {fontFamily: 'Inter_400Regular'}]}
            placeholder='Search films...'
            value={query}
            onChangeText={setQuery}
            placeholderTextColor={Colors.text_placeholder}
            onSubmitEditing={() => {
              if (query.length > 0) {
                lastQuery.current = query
                setQuery('')
                handleSearch()
              }
            }}
            returnKeyType='search'
          />
          <Pressable
            style={[{backgroundColor: Colors.heteroboxd, padding: 10, borderTopRightRadius: 10, borderBottomRightRadius: 10}, (query.length === 0) && {opacity: 0.8}]}
            disabled={query.length === 0}
            onPress={() => { lastQuery.current = query; setQuery(''); handleSearch() }}
          >
            <Fontisto name='search' size={widescreen ? 24 : 22} color={Colors.text_button} />
          </Pressable>
        </KeyboardAvoidingView>
        {
          server.result === 0 && (
          <View style={{width: '100%', alignItems: 'center', paddingVertical: 30}}>
            <ActivityIndicator size='large' color={Colors.text_link} />
          </View>
          )
        }
      </>

      <Snackbar
        visible={server.result === 500}
        onDismiss={() => setServer(Response.initial)}
        duration={3000}
        style={{
          backgroundColor: Colors.card,
          width: widescreen ? '50%' : '90%',
          alignSelf: 'center',
          borderRadius: 8,
        }}
        action={{
          label: 'OK',
          onPress: () => setServer(Response.initial),
          textColor: Colors.text_link
        }}
      >
        {server.message}
      </Snackbar>
    </View>
  )
}

export default SearchBox

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    color: Colors.text_input,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    fontSize: 16
  },
})