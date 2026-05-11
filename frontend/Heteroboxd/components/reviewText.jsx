import { View, Pressable } from 'react-native'
import ParsedRead from './parsedRead'
import Spoiler from '../assets/icons/spoiler.svg'
import HText from './htext'
import { Colors } from '../constants/colors'

const ReviewText = ({ text, width, maxHeight, spoiler, revealSpoiler, widescreen }) => {
  if (text?.length > 0) {
    if (spoiler) {
      return (
        <View style={{width: width, maxHeight: maxHeight, overflow: 'hidden'}}>
          <ParsedRead html={text.replace(/\n{2,}/g, '\n').trim()} contentWidth={width} />
        </View>
      )
    } else {
      return (
        <Pressable onPress={revealSpoiler}>
          <View style={{width: width, alignSelf: 'center', padding: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center'}}>
            <Spoiler width={widescreen ? 30 : 24} height={widescreen ? 30 : 24} />
            <HText style={{color: Colors.text, fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>This review contains spoilers.{'\n'}<HText style={{color: Colors.text_link}}>Read anyway?</HText></HText>
          </View>
        </Pressable>
      )
    }
  } else {
    return (
      <View style={{ width: width }}>
        <HText style={{color: Colors.text, fontStyle: 'italic', fontSize: widescreen ? 18 : 14, textAlign: 'center'}}>The author was left speechless.</HText>
      </View>
    )
  }
}

export default ReviewText