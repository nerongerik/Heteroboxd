import { useEffect, useState } from 'react'
import { StyleSheet, View, TextInput, TouchableOpacity, Modal, Text } from 'react-native'
import { Colors } from '../constants/colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRef } from 'react';

const ParsedInput = ({initial, width, onValueChange}) => {

  const [text, setText] = useState('');
  const [currentLink, setCurrentLink] = useState('');
  const [visible, setVisible] = useState(false);

  const inputRef = useRef(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [pendingTag, setPendingTag] = useState(null); // used for <a>

  useEffect(() => {
    //if this helper component is updating an existing comment/review instead of making a new one from scratch,
    //firstly display the existing text if any
    if (initial && initial !== '') setText(initial);
  }, [initial, text])

  useEffect(() => {
    onValueChange(text);
  }, [text]);

  const applyTag = (openTag, closeTag) => {
    const { start, end } = selection;

    const before = text.slice(0, start);
    const selected = text.slice(start, end);
    const after = text.slice(end);

    let newText;
    let newCursorPos;

    if (start !== end) {
      // Wrap selected text
      newText = `${before}${openTag}${selected}${closeTag}${after}`;
      newCursorPos = end + openTag.length + closeTag.length;
    } else {
      // Insert empty tags and place cursor between them
      newText = `${before}${openTag}${closeTag}${after}`;
      newCursorPos = start + openTag.length;
    }

    setText(newText);

    // Cursor update must happen after render
    requestAnimationFrame(() => {
      setSelection({ start: newCursorPos, end: newCursorPos });
    });
  };

  const confirmLink = () => {
    const { start, end } = pendingTag.selection;

    const before = text.slice(0, start);
    const selected = text.slice(start, end);
    const after = text.slice(end);

    const openTag = `<a href="${currentLink}">`;
    const closeTag = `</a>`;

    let newText;
    let cursorPos;

    if (start !== end) {
      newText = `${before}${openTag}${selected}${closeTag}${after}`;
      cursorPos = end + openTag.length + closeTag.length;
    } else {
      newText = `${before}${openTag}${closeTag}${after}`;
      cursorPos = start + openTag.length;
    }

    setText(newText);
    setCurrentLink('');
    setVisible(false);

    requestAnimationFrame(() => {
      setSelection({ start: cursorPos, end: cursorPos });
    });
  };

  const insertMarkup = (tag) => {
    switch (tag) {
      case 'i':
        applyTag('<i>', '</i>');
        break;
      case 'strong':
        applyTag('<strong>', '</strong>');
        break;
      case 'u':
        applyTag('<u>', '</u>');
        break;
      case 'a':
        setPendingTag({
          selection,
        });
        setVisible(true);
        break;
    }
  }

  return (
    <View style={{width: width*0.9, maxWidth: 1000}}>
      <TextInput
        scrollEnabled={true}
        ref={inputRef}
        value={text}
        onChangeText={setText}
        selection={selection}
        onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        multiline
        selectionColor={Colors.heteroboxd}
        style={{
          textAlignVertical: 'top',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: Colors.border_color,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          padding: 20,
          overflow: 'hidden',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          color: Colors.text_input,
          fontSize: 16,
          height: 250
        }}
      />
      <View
        style={{
          borderWidth: 2,
          borderColor: Colors.border_color,
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
          width: width*0.9,
          maxWidth: 1000,
          padding: 5,
          backgroundColor: Colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-evenly'
        }}>
          <TouchableOpacity onPress={() => insertMarkup('i')}>
            <FontAwesome name="italic" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertMarkup('strong')}>
            <FontAwesome name="bold" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertMarkup('u')}>
            <FontAwesome name="underline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => insertMarkup('a')}>
            <FontAwesome name="external-link" size={20} color={Colors.text} />
          </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
      >
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
          <View style={{backgroundColor: Colors.card, padding: 15, borderRadius: 10, alignItems: 'center'}}>
            <Text style={{fontSize: 20, fontWeight: '600', paddingVertical: 7, color: Colors.text_title, textAlign: 'center'}}>Enter hyperlink destination:</Text>
            <TextInput
              placeholder='https://www.youtube.com/@nerongerik'
              value={currentLink}
              onChangeText={setCurrentLink}
              placeholderTextColor={Colors.text_placeholder}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: Colors.border_color,
                borderRadius: 3,
                padding: 7,
                paddingHorizontal: 10,
                overflow: 'hidden',
                outlineStyle: 'none',
                outlineWidth: 0,
                outlineColor: 'transparent',
                color: Colors.text_input,
                fontSize: 16,
                width: width >= 1000 ? width/4 : width/2,
                marginBottom: 20
              }}
            />
            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <TouchableOpacity onPress={() => {setCurrentLink(''); setVisible(false)}} style={[styles.button, { backgroundColor: Colors.button_reject, marginHorizontal: 10 }]}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={!URL.canParse(currentLink)} onPress={confirmLink} style={[styles.button, { backgroundColor: Colors.button_confirm, marginHorizontal: 10 }, (!URL.canParse(currentLink)) && {opacity: 0.5}]}>
                <Text style={styles.buttonText}>Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  )
}

export default ParsedInput;

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.button,
    paddingVertical: 7,
    borderRadius: 3,
    width: 75,
    alignItems: 'center'
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: '600',
  },
})