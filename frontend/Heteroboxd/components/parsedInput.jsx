import { useEffect, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import LinkIco from '../assets/icons/link.svg'
import Italic from '../assets/icons/italic.svg'
import Bold from '../assets/icons/bold.svg'
import Under from '../assets/icons/underline.svg'
import { Colors } from '../constants/colors'
import HText from './htext'

const ParsedInput = ({ initial, width, onValueChange }) => {
  const [ text, setText ] = useState('')
  const [ currentLink, setCurrentLink ] = useState('')
  const [ visible, setVisible ] = useState(false)
  const inputRef = useRef(null)
  const [ selection, setSelection ] = useState({ start: 0, end: 0 })
  const [ pendingTag, setPendingTag ] = useState(null)
  const [ border1, setBorder1 ] = useState(false)
  const [ border2, setBorder2 ] = useState(false)

  const applyTag = (openTag, closeTag) => {
    const { start, end } = selection
    const before = text.slice(0, start)
    const selected = text.slice(start, end)
    const after = text.slice(end)
    let newText
    let newCursorPos
    if (start !== end) {
      newText = `${before}${openTag}${selected}${closeTag}${after}`
      newCursorPos = end + openTag.length + closeTag.length
    } else {
      newText = `${before}${openTag}${closeTag}${after}`
      newCursorPos = start + openTag.length
    }
    setText(newText)
    requestAnimationFrame(() => {
      setSelection({ start: newCursorPos, end: newCursorPos })
    })
  }

  const confirmLink = () => {
    const { start, end } = pendingTag.selection
    const before = text.slice(0, start)
    const selected = text.slice(start, end)
    const after = text.slice(end)
    const openTag = `<a href="${currentLink}">`
    const closeTag = `</a>`
    let newText
    let cursorPos
    if (start !== end) {
      newText = `${before}${openTag}${selected}${closeTag}${after}`
      cursorPos = end + openTag.length + closeTag.length
    } else {
      newText = `${before}${openTag}${closeTag}${after}`
      cursorPos = start + openTag.length
    }
    setText(newText)
    setCurrentLink('')
    setVisible(false)
    requestAnimationFrame(() => { setSelection({ start: cursorPos, end: cursorPos }) })
  }

  const insertMarkup = (tag) => {
    switch (tag) {
      case 'i':
        applyTag('<i>', '</i>')
        break
      case 'strong':
        applyTag('<strong>', '</strong>')
        break
      case 'u':
        applyTag('<u>', '</u>')
        break
      case 'a':
        setPendingTag({ selection })
        setVisible(true)
        break
    }
  }

  useEffect(() => {
    setText(initial || '')
  }, [initial])

  useEffect(() => {
    onValueChange(text)
  }, [text])

  return (
    <View style={{width: Math.min(width*0.9, 1000)}}>
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
          borderColor: border1 ? Colors.heteroboxd : Colors.border_color,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          padding: width > 1000 ? 20 : 10,
          overflow: 'hidden',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          color: Colors.text_input,
          fontSize: 16,
          height: 250,
          fontFamily: 'Inter_400Regular'
        }}
        onFocus={() => setBorder1(true)}
        onBlur={() => setBorder1(false)}
      />
      <View
        style={{
          borderWidth: 2,
          borderTopColor: Colors.border_color,
          borderColor: border1 ? Colors.heteroboxd : Colors.border_color,
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
          <Pressable onPress={() => insertMarkup('i')}>
            <Italic width={20} height={20} />
          </Pressable>
          <Pressable onPress={() => insertMarkup('strong')}>
            <Bold width={24} height={24} />
          </Pressable>
          <Pressable onPress={() => insertMarkup('u')}>
            <Under width={26} height={26} />
          </Pressable>
          <Pressable onPress={() => insertMarkup('a')}>
            <LinkIco width={20} height={20} />
          </Pressable>
      </View>

      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
      >
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
          <View style={{backgroundColor: Colors.card, padding: 15, borderRadius: 10, alignItems: 'center'}}>
            <HText style={{fontSize: 20, fontWeight: '600', paddingVertical: 7, color: Colors.text_title, textAlign: 'center'}}>Enter hyperlink destination:</HText>
            <TextInput
              placeholder='https://www.youtube.com/@nerongerik'
              value={currentLink}
              onChangeText={setCurrentLink}
              placeholderTextColor={Colors.text_placeholder}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: border2 ? Colors.heteroboxd : Colors.border_color,
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
              onFocus={() => setBorder2(true)}
              onBlur={() => setBorder2(false)}
              onSubmitEditing={() => {
                if (URL.canParse(currentLink)) {
                  confirmLink()
                }
              }}
              returnKeyType='done'
            />
            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <Pressable onPress={() => {setCurrentLink(''); setVisible(false)}} style={[styles.button, { backgroundColor: Colors.heteroboxd, marginHorizontal: 10 }]}>
                <HText style={styles.buttonText}>Cancel</HText>
              </Pressable>
              <Pressable disabled={!URL.canParse(currentLink)} onPress={confirmLink} style={[styles.button, { backgroundColor: Colors._heteroboxd, marginHorizontal: 10 }, (!URL.canParse(currentLink)) && {opacity: 0.5}]}>
                <HText style={styles.buttonText}>Link</HText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default ParsedInput

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.heteroboxd,
    paddingVertical: 7,
    borderRadius: 3,
    width: 75,
    alignItems: 'center'
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: '600',
  }
})