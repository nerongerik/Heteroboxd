import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, FlatList, Linking, PanResponder, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, RefreshControl } from "react-native"
import Eye from '../../assets/icons/eye2.svg'
import * as format from '../../helpers/format'
import { Colors } from '../../constants/colors'
import { Headshot } from '../headshot'
import HText from '../htext'
import { Poster } from '../poster'
import Interact from '../interact'
import SlidingMenu from '../slidingMenu'

const CelebrityTabs = ({ user, bio, currentTabData, availableRoles, activeTab, onTabChange, onFilmPress, onPageChange, pageSize, showSeen, flipShowSeen, seenFilms, updateSeenFilms, seenCount, fadeSeen, isRefreshing, onRefresh, loading }) => {
  const { width } = useWindowDimensions()
  const listRef = useRef(null)
  const [ menuShown2, setMenuShown2 ] = useState(false)
  const slideAnim2 = useState(new Animated.Value(0))[0]
  const [ selected, setSelected ] = useState(null)

  const translateY2 = slideAnim2.interpolate({inputRange: [0, 1], outputRange: [300, 0]})
  const openMenu2 = useCallback((id) => {
    if (!user) return
    setSelected(id)
    setMenuShown2(true)
    Animated.timing(slideAnim2, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start()
  }, [user, slideAnim2])
  const closeMenu2 = useCallback(() => {
    setSelected(null)
    Animated.timing(slideAnim2, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setMenuShown2(false))
  }, [slideAnim2])

  const widescreen = useMemo(() => width > 1000, [width])
  const spacing = useMemo(() => (widescreen ? 50 : 5), [widescreen])
  const maxRowWidth = useMemo(() => (widescreen ? 1000 : width * 0.95), [widescreen, width])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])
  const headshotWidth = useMemo(() => widescreen ? posterWidth - 20 : posterWidth + 20, [widescreen, posterWidth])
  const headshotHeight = useMemo(() => headshotWidth * 3 / 2, [headshotWidth])

  const totalPages = Math.ceil((currentTabData?.totalCount || 0) / pageSize)

  const loadNextPage = useCallback(() => {
    if (currentTabData?.page < totalPages) {
      onPageChange(currentTabData?.page + 1)
    }
  }, [currentTabData?.page, totalPages, onPageChange])

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
      style={[styles.tabButton, {flex: widescreen ? 1 : null, paddingHorizontal: widescreen ? null : title === 'Bio' ? 10 : 5 }, active && styles.activeTabButton]}
    >
      <HText style={[{fontSize: width > 1000 ? 16 : width > 300 ? 14 : 12, color: Colors.text}, active && styles.activeTabText]}>{title}</HText>
    </Pressable>
  ), [widescreen])

  const Header = useMemo(() => {
    if (activeTab === 'Bio') return null
    return (
      <>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'center', width: maxRowWidth}}>
          <View style={{padding: 5}}>
            <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 16}}>
              {(!currentTabData?.totalCount || currentTabData.totalCount === 0) ? '' : `${currentTabData.totalCount} films`}
            </HText>
          </View>
          {
            showSeen ? (
              <Pressable onPress={flipShowSeen}>
                <View style={{padding: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                  <Eye width={widescreen ? 22 : 18} height={widescreen ? 22 : 18} />
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

  const Filmography = useCallback(({ item }) => {
    if (!item) {
      return <View style={{width: posterWidth, height: posterHeight, margin: spacing / 2}} />
    }
    const isSeen = fadeSeen && seenFilms.has(item.id)
    return (
      <Pressable
        onPress={() => onFilmPress(item.id)}
        onLongPress={() => openMenu2(item.id)}
        style={{margin: spacing / 2}}
      >
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

  const Footer = useMemo(() => loading ? (
    <ActivityIndicator size='small' color={Colors.text_link} />
  ) : null, [loading])

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
          <Pressable
            onPress={() => {
              if (!bio.url) {}
              else Linking.openURL(bio.url)
            }}
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
          </Pressable>
          <HText style={{textAlign: 'left', fontSize: widescreen ? 18 : 14, color: Colors.text, padding: 10}}>{bio.text}</HText>
        </ScrollView>
      ) : (
        <FlatList
          ref={listRef}
          data={currentTabData?.films || []}
          key={activeTab}
          keyExtractor={(item, index) => item?.id ? `${activeTab}-${item.id}` : `${activeTab}-placeholder-${index}`}
          ListHeaderComponent={Header}
          renderItem={Filmography}
          ListFooterComponent={Footer}
          numColumns={4}
          columnWrapperStyle={{justifyContent: 'center'}}
          style={{width: maxRowWidth, alignSelf: 'center'}}
          contentContainerStyle={{paddingHorizontal: spacing / 2, paddingBottom: 80}}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.2}
          onEndReached={loadNextPage}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={onRefresh}
            />
          }
        />
      )}

      <SlidingMenu
        menuShown={menuShown2}
        closeMenu={closeMenu2}
        translateY={translateY2}
        widescreen={widescreen}
        width={width}
      >
        <Interact
          widescreen={widescreen}
          filmId={selected}
          close={closeMenu2}
          fade={() => updateSeenFilms(selected)}
          del={() => {}}
        />
      </SlidingMenu>
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
  activeTabText: {
    color: Colors.text_title,
    fontWeight: 'bold',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: Colors.heteroboxd,
  }
})