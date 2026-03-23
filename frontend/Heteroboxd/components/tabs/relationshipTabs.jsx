import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import X from '../../assets/icons/x.svg'
import { Colors } from '../../constants/colors'
import HText from '../htext'
import { UserAvatar } from '../userAvatar'

const RelationshipTabs = ({ isMyProfile, followers, following, blocked, onUserPress, onRemoveFollower, onPageChange, active, pageSize }) => {
  const [ activeTab, setActiveTab ] = useState(active)
  const { width } = useWindowDimensions()
  const listRef = useRef(null)

  const widescreen = useMemo(() => width > 1000, [width])

  const allTabs = useMemo(() => {
    const tabs = ['followers', 'following']
    if (isMyProfile) tabs.push('blocked')
    return tabs
  }, [isMyProfile])

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'followers': return followers
      case 'following': return following
      case 'blocked': return blocked
      default: return { items: [], totalCount: 0, page: 1 }
    }
  }, [activeTab, followers, following, blocked])

  const totalPages = useMemo(() => Math.ceil(currentData.totalCount / pageSize), [currentData.totalCount, pageSize])

  const loadNextPage = useCallback(() => {
    if (currentData.page < totalPages) {
      onPageChange(activeTab, currentData.page + 1)
    }
  }, [currentData.page, totalPages, activeTab, onPageChange])

  const panResponder = useMemo(() => {
    if (widescreen) return null
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2,
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 50) return
        const currentIndex = allTabs.indexOf(activeTab)
        if (dx < 0 && currentIndex < allTabs.length - 1) {
          setActiveTab(allTabs[currentIndex + 1])
        } else if (dx > 0 && currentIndex > 0) {
          setActiveTab(allTabs[currentIndex - 1])
        }
      }
    })
  }, [widescreen, allTabs, activeTab])

  const TabButton = useCallback(({ title, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <HText style={[{fontSize: width > 1000 ? 16 : width > 300 ? 14 : 12, color: Colors.text}, active && styles.activeTabText]}>{title}</HText>
    </Pressable>
  ), [])

  return (
    <View style={{flex: 1}} {...(panResponder?.panHandlers ?? {})}>
      <View style={widescreen ? styles.tabRowWeb : styles.tabRowMobile}>
        <TabButton title='Followers' active={activeTab === 'followers'} onPress={() => setActiveTab('followers')} />
        <TabButton title='Following' active={activeTab === 'following'} onPress={() => setActiveTab('following')} />
        {isMyProfile && <TabButton title='Blocked' active={activeTab === 'blocked'} onPress={() => setActiveTab('blocked')} />}
      </View>

      <FlatList
        ref={listRef}
        data={currentData.items ?? []}
        key={activeTab}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        renderItem={({ item }) => (
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Pressable style={styles.userRow} onPress={() => onUserPress(item.id)}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <UserAvatar
                  pictureUrl={item.pictureUrl}
                  style={[styles.picture, {
                    width: widescreen ? 50 : 30,
                    height: widescreen ? 50 : 30,
                    borderRadius: widescreen ? 25 : 15
                  }]}
                />
                <HText style={[styles.username, {fontSize: widescreen ? 22 : 18}]}>
                  {item.name}
                  {item.admin && <HText style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</HText>}
                </HText>
              </View>
            </Pressable>
            {isMyProfile && activeTab === 'followers' && (
              <Pressable onPress={() => onRemoveFollower(item.id)}>
                <X width={20} height={20} />
              </Pressable>
            )}
          </View>
        )}
        contentContainerStyle={{width: Math.min(width, 1000), alignSelf: widescreen ? 'center' : 'stretch', paddingHorizontal: 10, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.2}
        onEndReached={loadNextPage}
      />
    </View>
  )
}

export default RelationshipTabs

const styles = StyleSheet.create({
  tabRowMobile: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: "space-between",
    width: '100%',
    marginBottom: 20,
  },
  tabRowWeb: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 20,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    flex: 1,
  },
  activeTabText: {
    color: Colors.text_title,
    fontWeight: "bold",
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: Colors.heteroboxd,
  },
  userRow: {
    paddingVertical: 14,
    lineHeight: 30,
    paddingHorizontal: 5
  },
  username: {
    marginLeft: 10,
    color: Colors.text
  },
  picture: {
    borderColor: Colors.border_color,
    borderWidth: 1,
  }
})