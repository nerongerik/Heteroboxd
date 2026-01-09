import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, FlatList, Pressable } from 'react-native'
import { Colors } from '../../constants/colors';
import Author from '../author';
import Stars from '../stars';
import ParsedRead from '../parsedRead';
import { Fontisto } from '@expo/vector-icons';
import * as format from '../../helpers/format';
import {Poster} from '../poster';

const LikeTabs = ({reviews, lists, refreshing, onRefresh, router }) => {
  const [activeTab, setActiveTab] = useState("reviews");
  const { width } = useWindowDimensions();

  const maxRowWidth = useMemo(() => width > 1000 ? 900 : width*0.95, [width]);
  const spacing = useMemo(() => (width > 1000 ? 30 : 5), [width])
  const posterWidth = useMemo(
    () => (maxRowWidth - spacing * 4) / 4,
    [maxRowWidth, spacing]
  )
  const posterHeight = useMemo(
    () => posterWidth * (3 / 2),
    [posterWidth]
  )

  const getData = () => {
    switch (activeTab) {
      case 'reviews':
        return reviews ?? [];
      case 'lists':
        return lists ?? [];
      default:
        return [];
    }
  }

  const TabButton = ({ title, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.tabButton, active && styles.activeTabButton]}>
      <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const RenderReview = ({item}) => (
    <View style={[styles.card, { marginBottom: 5 }]}>
      <View style={{marginLeft: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Author
          userId={item.authorId}
          url={item.authorProfilePictureUrl}
          username={item.authorName}
          tier={item.authorTier}
          patron={item.authorPatron}
          router={router}
          widescreen={width > 1000}
        />
        <Stars size={width > 1000 ? 30 : 20} rating={item.rating} readonly={true} padding={false} align={'flex-end'} />
      </View>
      <Pressable onPress={() => router.push(`/review/${item.id}`)}>
        <Text style={{padding: 5, flex: 1, flexWrap: 'wrap', fontWeight: '600', textAlign: 'left', fontSize: width > 1000 ? 20 : 16, color: Colors.text_title}}>{item.filmTitle}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
          <View style={{width: posterWidth, height: posterHeight, marginRight: 5}}>
            <Poster
              posterUrl={item.filmPosterUrl}
              style={{
                width: posterWidth,
                height: posterHeight,
                borderWidth: 2,
                borderRadius: 6,
                borderColor: Colors.border_color
              }}
            />
          </View>
          {
            item.text && item.text.length > 0 ?
              <View style={{width: maxRowWidth - posterWidth - 10, maxHeight: posterHeight, overflow: 'hidden'}}>
                <ParsedRead html={`${item.text.replace(/\n{2,}/g, '\n').trim().slice(0, 200)}${item.text.length > 200 ? '...' : ''}`} />
              </View>
            :
              <View style={{width: maxRowWidth - posterWidth - 10, marginLeft: -5}}>
                <Text style={{color: Colors.text, fontStyle: 'italic', fontSize: 16, textAlign: 'center'}}>{authorName} wrote no review regarding this film.</Text>
              </View>
          }
        </View>
        <View style={styles.statsRow}>
          <Fontisto name="heart" size={width > 1000 ? 16 : 12} color={Colors.heteroboxd} />
          <Text style={[styles.statText, {fontSize: width > 1000 ? 16 : 12}]}>{format.formatCount(item.likeCount)}</Text>
        </View>
      </Pressable>
    </View>
  )

  const RenderList = ({item}) => (
    <View style={[styles.card, { marginBottom: 5 }]}>
      <View style={{marginLeft: 5, marginBottom: -5}}>
        <Author
          userId={item.authorId}
          url={item.authorProfilePictureUrl}
          username={item.authorName}
          tier={item.authorTier}
          patron={item.authorPatron}
          router={router}
          widescreen={width > 1000}
        />
      </View>
      <Pressable onPress={() => router.push(`/list/${item.id}`)}>
        <Text style={[styles.listTitle, {fontSize: width > 1000 ? 22 : 18}]}>{item.name}</Text>
                      
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {(() => {
            const paddedFilms = [...item.films].sort((a, b) => a.position - b.position);
            const remainder = paddedFilms.length % 4;
            if (remainder !== 0) {
              const placeholdersToAdd = 4 - remainder;
              for (let i = 0; i < placeholdersToAdd; i++) {
                paddedFilms.push(null);
              }
            }
                                  
            return paddedFilms.map((film, i) => (
              film ? (
                <Poster
                  key={film.filmId}
                  posterUrl={film.filmPosterUrl}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    marginRight: i % 4 === 3 ? 0 : width > 1000 ? spacing : spacing/2,
                    borderWidth: 2,
                    borderColor: Colors.border_color,
                    borderRadius: 6,
                  }}
                />
              ) : (
                <View
                  key={`placeholder-${i}`}
                  style={{
                    width: posterWidth,
                    height: posterHeight,
                    marginRight: i % 4 === 3 ? 0 : width > 1000 ? spacing : spacing/2,
                  }}
                />
              )
            ));
          })()}
        </View>
                        
        <Text style={[styles.description, {fontSize: width > 1000 ? 18 : 14}]}>
          {item.description.slice(0, width > 1000 ? 500 : 150)}
          {width > 1000 && item.description.length > 500 && '...'}
          {width <= 1000 && item.description.length > 150 && '...'}
        </Text>
                          
        <View style={styles.statsRow}>
          <Fontisto name="nav-icon-list-a" size={width > 1000 ? 18 : 14} color={Colors._heteroboxd} />
          <Text style={[styles.statText, {color: Colors._heteroboxd, fontSize: width > 1000 ? 18 : 14}]}>{format.formatCount(item.listEntryCount)} </Text>
          <Fontisto name="heart" size={width > 1000 ? 18 : 14} color={Colors.heteroboxd} />
          <Text style={[styles.statText, {fontSize: width > 1000 ? 18 : 14}]}>{format.formatCount(item.likeCount)}</Text>
        </View>
      </Pressable>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={[width > 1000 ? styles.wideRow : styles.narrowRow]}>
        <TabButton title="Reviews" active={activeTab === "reviews"} onPress={() => setActiveTab("reviews")} />
        <TabButton title="Lists" active={activeTab === "lists"} onPress={() => setActiveTab("lists")} />
      </View>

      <FlatList
        data={getData()}
        key={activeTab}
        keyExtractor={(item) => item?.reviewId ? `${activeTab}-${item.reviewId}` : `${activeTab}-${item.listId}`}
        renderItem={activeTab === 'reviews' ? RenderReview : RenderList}
        ListEmptyComponent={<Text style={{color: Colors.text, fontSize: 16, textAlign: 'center', padding: 50}}>Nothing to show here.</Text>}
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={{
          width: maxRowWidth,
          alignSelf: 'center'
        }}
        contentContainerStyle={{
          paddingBottom: 80,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

export default LikeTabs

const styles = StyleSheet.create({
  container: { flex: 1 },
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