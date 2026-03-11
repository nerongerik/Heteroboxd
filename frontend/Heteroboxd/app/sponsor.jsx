import { useMemo } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { Colors } from '../constants/colors'

const BuyMeACoffeeIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 8h14l-1.5 9.5A2 2 0 0 1 15.52 19H8.48a2 2 0 0 1-1.98-1.5L5 8Z" fill="#FFDD00" stroke="#1A1A1A" strokeWidth={1.2} strokeLinejoin="round" />
    <Path d="M19 9.5h1.5a1.5 1.5 0 0 1 0 3H19" stroke="#1A1A1A" strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M9 5.5C9 5.5 9.5 4.5 9 3.5" stroke="#1A1A1A" strokeWidth={1.1} strokeLinecap="round" />
    <Path d="M12 5.5C12 5.5 12.5 4.5 12 3.5" stroke="#1A1A1A" strokeWidth={1.1} strokeLinecap="round" />
    <Path d="M15 5.5C15 5.5 15.5 4.5 15 3.5" stroke="#1A1A1A" strokeWidth={1.1} strokeLinecap="round" />
    <Path d="M7.5 10.5h9" stroke="#B8860B" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
  </Svg>
)

const PayPalIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 4h5.5C13.5 4 15 5.2 14.8 7.2 14.5 9.5 12.8 10.8 10.8 10.8H9.2L8.5 15H5.5L6 4Z" fill="#003087" />
    <Path d="M8 6.5h5.5C15.5 6.5 17 7.7 16.8 9.7 16.5 12 14.8 13.3 12.8 13.3H11.2L10.5 18H7.5L8 6.5Z" fill="#009CDE" />
    <Path d="M10 9h4.5C16.5 9 17.8 10 17.6 11.8 17.3 14 15.8 15 13.8 15H12.5L12 19H9.5L10 9Z" fill="#012169" opacity={0.7} />
  </Svg>
)

const PatreonIcon = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={15} cy={9.5} r={5} fill="#FF424D" />
    <Rect x={4} y={4} width={3.5} height={16} rx={1} fill="#052D49" />
  </Svg>
)

const Sponsor = () => {
  const { width } = useWindowDimensions()
  const widescreen = useMemo(() => width > 1000, [width])
  const iconSize = widescreen ? 50 : 36

  return (
    <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background}}>
      <ScrollView
        contentContainerStyle={{width: widescreen ? 1000 : width * 0.95, flexGrow: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center',}}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Donate to Heteroboxd</Text>

        <Pressable onPress={() => Linking.openURL('https://buymeacoffee.com/nerongerik')} style={[styles.card, { width: widescreen ? 500 : '80%', marginBottom: widescreen ? 15 : 5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
            <View style={styles.iconWrapper}>
              <BuyMeACoffeeIcon size={iconSize} />
            </View>
            <Text style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16, marginLeft: 10 }}>Buy Me a Coffee</Text>
          </View>
          <Text style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16 }}>{'➜'}</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL('https://paypal.me/nerongerik')} style={[styles.card, { width: widescreen ? 500 : '80%', marginBottom: widescreen ? 15 : 5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
            <View style={styles.iconWrapper}>
              <PayPalIcon size={iconSize} />
            </View>
            <Text style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16, marginLeft: 10 }}>PayPal</Text>
          </View>
          <Text style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16 }}>{'➜'}</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL('https://patreon.com/nerongerik')} style={[styles.card, { width: widescreen ? 500 : '80%' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
            <View style={styles.iconWrapper}>
              <PatreonIcon size={iconSize} />
            </View>
            <Text style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16, marginLeft: 10 }}>Patreon</Text>
          </View>
          <Text style={{ color: Colors.text_title, fontSize: widescreen ? 20 : 16 }}>{'➜'}</Text>
        </Pressable>

        <Text style={{ fontWeight: widescreen ? '400' : '300', marginTop: 30, fontSize: widescreen ? 18 : 16, color: Colors.text, textAlign: 'center' }}>
          Heteroboxd is free to use and intends to stay that way. You can help us cover our maintenance fees with a donation!{'\n'}{'\n'}
          100% optional. 100% appreciated.{'\n'}
        </Text>
      </ScrollView>
    </View>
  )
}

export default Sponsor

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    color: Colors.text_title,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'space-between',
    alignSelf: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border_color,
  },
  iconWrapper: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  }
})