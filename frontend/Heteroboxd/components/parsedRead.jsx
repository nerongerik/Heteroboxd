import RenderHTML from 'react-native-render-html'
import { Colors } from '../constants/colors'
import { useWindowDimensions } from 'react-native'

const ParsedRead = ({ html, contentWidth }) => {
  const { width } = useWindowDimensions()
  const normalized = `${html.replace(/\n/g, '<br />')}`

  return (
    <RenderHTML
      contentWidth={contentWidth || width }
      source={{ html: normalized }}
      defaultTextProps={{
        selectable: true,
      }}
      baseStyle={{
        fontFamily: 'Inter_400Regular',
        fontSize: width > 1000 ? 16 : 14,
        color: Colors.text_input,
        lineHeight: 24,
        paddingHorizontal: 3,
        userSelect: 'text',
        cursor: 'text'
      }}
      tagsStyles={{
        strong: { fontWeight: 'bold' },
        i: { fontStyle: 'italic' },
        u: { textDecorationLine: 'underline' },
        a: { color: Colors.text_link, textDecorationLine: 'none', cursor: 'pointer' }
      }}
    />
  )
}

export default ParsedRead