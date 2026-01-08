import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'

const LikeTabs = ({reviews, lists, onReviewPress, onListPress, refreshing, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("Reviews");
  const { width } = useWindowDimensions();
  
  return (
    <View>
      <Text>LikeTabs</Text>
    </View>
  )
}

export default LikeTabs

const styles = StyleSheet.create({})