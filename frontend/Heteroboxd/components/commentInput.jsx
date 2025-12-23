import { useState, memo, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

const CommentInput = memo(({ onSubmit, widescreen, maxRowWidth, user }) => {
  const [text, setText] = useState('');
  const textInputRef = useRef(null);

  const handleSubmit = () => {
    if (text.trim().length > 0 && text.trim().length <= 500) {
      onSubmit(text);
      setText('');
    }
  };

  return (
    <View style={[styles.commentInputContainer, {width: maxRowWidth, alignSelf: 'center'}]}>
      <View style={styles.descWrapper}>
        <TextInput
          ref={textInputRef}
          value={text}
          onChangeText={setText}
          placeholder="Add a comment…"
          placeholderTextColor={Colors.text_placeholder}
          style={[styles.commentInput, {fontSize: widescreen ? 16 : 14, height: widescreen ? 80 : 60}]}
          multiline={true}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
        <Text style={[
          styles.counterText,
          {fontSize: widescreen ? 14 : 12},
          { color: text.trim().length < 501 ? Colors.text_title : Colors.password_meager }
        ]}>
          {text.trim().length}/500
        </Text>
      </View>
      <TouchableOpacity
        style={(text.trim().length === 0 || text.trim().length > 500) && { opacity: 0.5 }}
        onPress={handleSubmit}
        disabled={text.trim().length === 0 || text.trim().length > 500}
      >
        <Text style={{color: Colors.text_title, fontSize: widescreen ? 32 : 24, marginBottom: 10}}>{' ➜'}</Text>
      </TouchableOpacity>
    </View>
  );
});

export default CommentInput;

const styles = StyleSheet.create({
  commentInputContainer: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    color: Colors.text_input,
    padding: 10,
    backgroundColor: Colors.card,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    borderRadius: 4,
    textAlignVertical: 'top',
  },
  descWrapper: {
    marginBottom: 10,
    flex: 1,
  },
  counterText: {
    bottom: 5,
    position: 'absolute',
    right: 10
  },
});