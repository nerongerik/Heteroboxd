import { useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Colors } from '../../constants/colors'
import HText from '../htext'
import PaginationBar from '../paginationBar'
import { UserAvatar } from '../userAvatar'

const RelationshipTabs = ({ isMyProfile, followers, following, blocked, onUserPress, onRemoveFollower, onPageChange, active, pageSize }) => {
  const [ activeTab, setActiveTab ] = useState(active)
  const { width } = useWindowDimensions()
  const listRef = useRef(null)

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'followers':
        return followers
      case 'following':
        return following
      case 'blocked':
        return blocked
      default:
        return { items: [], totalCount: 0, page: 1 }
    }
  }, [activeTab, followers, following, blocked])
  const totalPages = Math.ceil(currentData.totalCount / pageSize)

  const TabButton = ({ title, active, onPress }) => {
    return (
      <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
        <HText style={[styles.tabText, active && styles.activeTabText]}>{title}</HText>
      </Pressable>
    )
  }

  const Footer = () => (
    <PaginationBar
      page={currentData.page}
      totalPages={totalPages}
      onPagePress={(num) => {
        onPageChange(activeTab, num)
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: true
        })
      }}
    />
  )

  return (
    <View style={{flex: 1}}>
      <View style={width > 1000 ? styles.tabRowWeb : styles.tabRowMobile}>
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
                <UserAvatar pictureUrl={item.pictureUrl} style={[styles.picture, {width: width > 1000 ? 50 : 30, height: width > 1000 ? 50 : 30, borderRadius: width > 1000 ? 25 : 15}]} />
                <HText style={[styles.username, {fontSize: width > 1000 ? 22 : 18}]}>{item.name}{item.admin && <HText style={{color: Colors._heteroboxd}}>{' [ADMIN]'}</HText>}</HText>
              </View>
            </Pressable>
            { isMyProfile && activeTab === 'followers' &&
              <Pressable onPress={() => onRemoveFollower(item.id)}>
                <Feather name='x' size={20} color={Colors.text} />
              </Pressable>
            }
          </View>
        )}
        ListFooterComponent={Footer}
        contentContainerStyle={{width: Math.min(width, 1000), alignSelf: width > 1000 ? 'center' : 'stretch', paddingHorizontal: 10, paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
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
  tabText: {
    fontSize: 16,
    color: Colors.text,
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
