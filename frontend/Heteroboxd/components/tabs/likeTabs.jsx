import { useCallback, useMemo, useRef, useState } from 'react'
import { FlatList, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Fontisto } from '@expo/vector-icons'
import * as format from '../../helpers/format'
import { Colors } from '../../constants/colors'
import Author from '../author'
import HText from '../htext'
import PaginationBar from '../paginationBar'
import ParsedRead from '../parsedRead'
import { Poster } from '../poster'
import Stars from '../stars'

const TABS = ['reviews', 'lists']

const LikeTabs = ({ reviews, lists, onPageChange, router, pageSize }) => {
  const [ activeTab, setActiveTab ] = useState('reviews')
  const { width } = useWindowDimensions()
  const listRef = useRef(null)

  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'reviews': return reviews
      case 'lists': return lists
      default: return { page: 1, items: [], totalCount: 0 }
    }
  }, [activeTab, reviews, lists])

  const widescreen = useMemo(() => width > 1000, [width])
  const totalPages = useMemo(() => Math.ceil(currentData.totalCount / pageSize), [currentData.totalCount, pageSize])
  const maxRowWidth = useMemo(() => widescreen ? 900 : width * 0.95, [widescreen, width])
  const spacing = useMemo(() => (widescreen ? 30 : 5), [widescreen])
  const posterWidth = useMemo(() => (maxRowWidth - spacing * 4) / 4, [maxRowWidth, spacing])
  const posterHeight = useMemo(() => posterWidth * (3 / 2), [posterWidth])

  const panResponder = useMemo(() => {
    if (widescreen) return null
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 2,
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) < 50) return
        const currentIndex = TABS.indexOf(activeTab)
        if (dx < 0 && currentIndex < TABS.length - 1) {
          setActiveTab(TABS[currentIndex + 1])
        } else if (dx > 0 && currentIndex > 0) {
          setActiveTab(TABS[currentIndex - 1])
        }
      }
    })
  }, [widescreen, activeTab])

  const TabButton = useCallback(({ title, active, onPress }) => (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <HText style={[styles.tabText, active && styles.activeTabText]}>{title}</HText>
    </Pressable>
  ), [])

  const Footer = useMemo(() => (
    <PaginationBar
      page={currentData.page}
      totalPages={totalPages}
      onPagePress={(num) => {
        onPageChange(activeTab, num)
        listRef.current?.scrollToOffset({ offset: 0, animated: true })
      }}
    />
  ), [currentData.page, totalPages, activeTab])

  const RenderReview = useCallback(({ item }) => (
    <View style={[styles.card, {marginBottom: 5}]}>
      <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Author
          userId={item.authorId}
          url={item.authorPictureUrl || null}
          username={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
          dim={widescreen ? 40 : 30}
        />
        <Stars size={widescreen ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
      </View>
      <Pressable onPress={() => router.push(`/review/${item.id}`)}>
        <HText style={{padding: 5, flex: 1, flexWrap: 'wrap', fontWeight: '600', textAlign: 'left', fontSize: widescreen ? 20 : 16, color: Colors.text_title}}>
          {format.sliceText(item.filmTitle || '', widescreen ? 100 : 50)}
        </HText>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
          <View style={{width: posterWidth, height: posterHeight, marginRight: 5}}>
            <Poster
              posterUrl={item.filmPosterUrl || 'noposter'}
              style={{
                width: posterWidth,
                height: posterHeight,
                borderWidth: 2,
                borderRadius: 6,
                borderColor: Colors.border_color
              }}
            />
          </View>
          {item.text?.length > 0 ? (
            <View style={{width: maxRowWidth - posterWidth - 10, maxHeight: posterHeight, overflow: 'hidden'}}>
              <ParsedRead html={`${format.sliceText(item.text.replace(/\n{2,}/g, '\n').trim(), widescreen ? 250 : 150)}`} contentWidth={maxRowWidth - posterWidth - 10} />
            </View>
          ) : (
            <View style={{width: maxRowWidth - posterWidth - 10, marginLeft: -5}}>
              <HText style={{color: Colors.text, fontStyle: 'italic', fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>The author was left speechless.</HText>
            </View>
          )}
        </View>
        <View style={styles.statsRow}>
          <Fontisto name='heart' size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
          <HText style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, router, posterWidth, posterHeight, maxRowWidth])

  const RenderList = useCallback(({ item }) => (
    <View style={[styles.card, {marginBottom: 5}]}>
      <View style={{marginLeft: 5, marginBottom: -5}}>
        <Author
          userId={item.authorId}
          url={item.authorPictureUrl || null}
          username={format.sliceText(item.authorName || 'Anonymous', widescreen ? 50 : 25)}
          admin={item.admin}
          router={router}
          widescreen={widescreen}
          dim={widescreen ? 40 : 30}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <HText style={[styles.listTitle, {fontSize: widescreen ? 20 : 16}]}>{format.sliceText(item.name || '', widescreen ? 80 : 40)}</HText>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          {item.films.map((film, i) => (
            film ? (
              <Poster
                key={film.filmId}
                posterUrl={film.filmPosterUrl || 'noposter'}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2,
                  borderWidth: 2,
                  borderColor: Colors.border_color,
                  borderRadius: 6
                }}
              />
            ) : (
              <View
                key={`placeholder-${i}`}
                style={{
                  width: posterWidth,
                  height: posterHeight,
                  marginRight: i % 4 === 3 ? 0 : widescreen ? spacing : spacing / 2
                }}
              />
            )
          ))}
        </View>
        <HText style={[styles.description, {fontSize: widescreen ? 16 : 14}]}>
          {format.sliceText(item.description || '', widescreen ? 500 : 150)}
        </HText>
        <View style={styles.statsRow}>
          <Fontisto name='nav-icon-list-a' size={widescreen ? 16 : 12} color={Colors._heteroboxd} />
          <HText style={[styles.statText, {color: Colors._heteroboxd, fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.listEntryCount)} </HText>
          <Fontisto name='heart' size={widescreen ? 16 : 12} color={Colors.heteroboxd} />
          <HText style={[styles.statText, {fontSize: widescreen ? 16 : 12}]}>{format.formatCount(item.likeCount)}</HText>
        </View>
      </Pressable>
    </View>
  ), [widescreen, router, posterWidth, posterHeight, spacing])

  return (
    <View style={{flex: 1}} {...(panResponder?.panHandlers ?? {})}>
      <View style={widescreen ? styles.wideRow : styles.narrowRow}>
        <TabButton title='Reviews' active={activeTab === 'reviews'} onPress={() => setActiveTab('reviews')} />
        <TabButton title='Lists' active={activeTab === 'lists'} onPress={() => setActiveTab('lists')} />
      </View>
      <FlatList
        ref={listRef}
        data={currentData.items ?? []}
        key={activeTab}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        renderItem={activeTab === 'reviews' ? RenderReview : RenderList}
        ListEmptyComponent={<HText style={{color: Colors.text, fontSize: 16, textAlign: 'center', padding: 50}}>Nothing to show here.</HText>}
        ListFooterComponent={Footer}
        style={{width: maxRowWidth, alignSelf: 'center'}}
        contentContainerStyle={{paddingBottom: 80}}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default LikeTabs

const styles = StyleSheet.create({
  narrowRow: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 5,
    justifyContent: "space-between",
    width: '100%',
    marginBottom: 20,
  },
  wideRow: {
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
  card: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border_color,
    borderRadius: 6,
    backgroundColor: Colors.card,
    padding: 5
  },
  listTitle: {
    color: Colors.text_title,
    fontWeight: '500',
    padding: 10,
  },
  description: {
    color: Colors.text,
    padding: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 3,
  },
  statText: {
    marginHorizontal: 4,
    fontWeight: 'bold',
    color: Colors.heteroboxd,
  },
})