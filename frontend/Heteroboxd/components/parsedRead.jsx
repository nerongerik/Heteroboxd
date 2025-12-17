import RenderHTML from 'react-native-render-html';
import { Colors } from '../constants/colors';

const ParsedRead = ({html}) => {
  const normalized = `${html.replace(/\n/g, '<br />')}`
  return (
    <RenderHTML
      source={{ html: normalized }}
      defaultTextProps={{
        selectable: true
      }}
      baseStyle={{
        fontSize: 16,
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
  );
}

export default ParsedRead;