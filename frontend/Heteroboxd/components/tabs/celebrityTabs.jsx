import { useCallback, useMemo, useRef } from "react"
import { FlatList, PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import * as format from '../../helpers/format'
import { Colors } from "../../constants/colors"
import { Headshot } from '../headshot'
import HText from '../htext'
import PaginationBar from '../paginationBar'
import { Poster } from '../poster'

const CelebrityTabs = ({ bio, currentTabData, availableRoles, activeTab, onTabChange, onFilmPress, onPageChange, pageSize, showSeen, flipShowSeen, seenFilms, seenCount, fadeSeen }) => {
  const { width } = useWindowDimensions()
  const listRef = useRef(null)

  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const headshotWidth = useMemo(() => widescreen ? posterWidth - 20 : posterWidth + 20, [widescreen, posterWidth])
  const headshotHeight = useMemo(() => headshotWidth * 3 / 2, [headshotWidth])

  const totalPages = Math.ceil((currentTabData?.totalCount || 0) / pageSize)

  const allTabs = useMemo(() => {
    const tabs = []
    if (bio) tabs.push('Bio')
    if (availableRoles.includes('Starred')) tabs.push('Starred')
    if (availableRoles.includes('Directed')) tabs.push('Directed')
    if (availableRoles.includes('Produced')) tabs.push('Produced')
    if (availableRoles.includes('Wrote')) tabs.push('Wrote')
    if (availableRoles.includes('Composed')) tabs.push('Composed')
    return tabs
  }, [bio, availableRoles])

  const panResponder = useMemo(() => {
    if (widescreen) return null
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2,
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 50) return
        const currentIndex = allTabs.indexOf(activeTab)
        if (dx < 0 && currentIndex < allTabs.length - 1) {
          onTabChange(allTabs[currentIndex + 1])
        } else if (dx > 0 && currentIndex > 0) {
          onTabChange(allTabs[currentIndex - 1])
        }
      }
    })
  }, [widescreen, allTabs, activeTab, onTabChange])

  const TabButton = useCallback(({ title, active, onPress }) => (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, {flex: widescreen ? 1 : null, paddingHorizontal: widescreen ? null : title === 'Bio' ? 15 : 5 }, active && styles.activeTabButton]}
    >
      <HText style={[styles.tabText, active && styles.activeTabText]}>{title}</HText>
    </Pressable>
  ), [widescreen])

  const Header = useMemo(() => {
    if (activeTab === 'Bio') return null
    return (
      <>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: maxRowWidth}}>
          <View style={{padding: 5}}>
            <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 16}}>
              {currentTabData?.totalCount || 0} films
            </HText>
          </View>
          {
            showSeen ? (
              <Pressable onPress={flipShowSeen}>
                <View style={{padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                  <MaterialCommunityIcons name='eye-outline' size={widescreen ? 22 : 18} color={Colors._heteroboxd} />
                  <HText style={{color: Colors._heteroboxd, fontSize: widescreen ? 18 : 16 }}> {format.roundSeen(seenCount, currentTabData?.totalCount)}% seen</HText>
                </View>
              </Pressable>
            ) : <View />
          }
        </View>
        <View style={{ height: widescreen ? 20 : 10 }} />
      </>
    )
  }, [activeTab, maxRowWidth, currentTabData?.totalCount, showSeen, widescreen, seenCount])

  const Footer = useMemo(() => (
    <PaginationBar
      page={currentTabData?.page || 1}
      totalPages={totalPages}
      onPagePress={(num) => {
        onPageChange(num)
        listRef.current?.scrollToOffset({ offset: 0, animated: true })
      }}
    />
  ), [currentTabData?.page, totalPages])

  const Filmography = useCallback(({ item }) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    const isSeen = fadeSeen && (seenFilms?.includes(item.id) ?? false)
    return (
      <Pressable onPress={() => onFilmPress(item.id)} style={{margin: spacing / 2}}>
        <Poster
          posterUrl={item.posterUrl || 'noposter'}
          style={{
            width: posterWidth,
            height: posterHeight,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSeen ? Colors.heteroboxd : Colors.border_color,
            opacity: isSeen ? 0.3 : 1
          }}
        />
      </Pressable>
    )
  }, [posterWidth, posterHeight, spacing, fadeSeen, seenFilms])

  return (
    <View style={{flex: 1}} {...(panResponder?.panHandlers ?? {})}>
      <View style={widescreen ? styles.tabRowWeb : styles.tabRowMobile}>
        {bio && (
          <TabButton 
            title='Bio'
            active={activeTab === 'Bio'} 
            onPress={() => onTabChange('Bio')} 
          />
        )}
        {availableRoles.includes('Starred') && (
          <TabButton 
            title='Acted'
            active={activeTab === 'Starred'} 
            onPress={() => onTabChange('Starred')} 
          />
        )}
        {availableRoles.includes('Directed') && (
          <TabButton 
            title='Directed'
            active={activeTab === 'Directed'} 
            onPress={() => onTabChange('Directed')} 
          />
        )}
        {availableRoles.includes('Produced') && (
          <TabButton 
            title='Produced'
            active={activeTab === 'Produced'} 
            onPress={() => onTabChange('Produced')} 
          />
        )}
        {availableRoles.includes('Wrote') && (
          <TabButton 
            title='Wrote'
            active={activeTab === 'Wrote'} 
            onPress={() => onTabChange('Wrote')} 
          />
        )}
        {availableRoles.includes('Composed') && (
          <TabButton 
            title='Composed'
            active={activeTab === 'Composed'} 
            onPress={() => onTabChange('Composed')} 
          />
        )}
      </View>
      
      {activeTab === 'Bio' && bio ? (
        <ScrollView 
          style={{alignSelf: 'center', marginBottom: 50}} 
          contentContainerStyle={{width: maxRowWidth, flexDirection: widescreen ? 'row' : 'column', justifyContent: 'flex-start'}} 
          showsVerticalScrollIndicator={false}
        >
          <Headshot
            pictureUrl={bio.url}
            style={{
              width: headshotWidth,
              height: headshotHeight,
              borderWidth: 1,
              borderColor: Colors.border_color,
              borderRadius: 4,
              margin: widescreen ? 10 : 0,
              alignSelf: widescreen ? 'auto' : 'center'
            }}
            wcp={true}
          />
          <HText style={{textAlign: 'left', fontSize: widescreen ? 18 : 14, color: Colors.text, padding: 10}}>{bio.text}</HText>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={currentTabData?.films || []}
          key={activeTab}
          keyExtractor={(item, index) => item?.id ? `${activeTab}-${item.id}` : `${activeTab}-placeholder-${index}`}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          renderItem={Filmography}
          numColumns={4}
          columnWrapperStyle={{justifyContent: 'center'}}
          style={{width: maxRowWidth, alignSelf: 'center'}}
          contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

export default CelebrityTabs

const styles = StyleSheet.create({
  tabRowMobile: {
    flexDirection: 'row',
    paddingVertical: 5,
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  tabRowWeb: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
    width: 1000,
    alignSelf: 'center'
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 15,
    color: Colors.text,
  },
  activeTabText: {
    color: Colors.text_title,
    fontWeight: 'bold',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: Colors.heteroboxd,
  }
})