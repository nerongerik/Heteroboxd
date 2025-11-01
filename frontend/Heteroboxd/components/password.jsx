import { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
 
const Password = ({ value, onChangeText, onValidityChange }) => {
  const [showRequirements, setShowRequirements] = useState(false);

  const checkRequirements = (pw) => ({
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  });

  const reqs = checkRequirements(value || "");
  const passed = Object.values(reqs).filter(Boolean).length;
  const isValid = Object.values(reqs).every(Boolean);

  useEffect(() => {
    if (typeof onValidityChange === 'function') {
      onValidityChange(isValid);
    }
  }, [isValid, onValidityChange]);
 
  const strengthColors = [
    Colors.password_weak,
    Colors.password_meager,
    Colors.password_meh,
    Colors.password_solid,
    Colors.password_acceptable,
    Colors.password_strong,
  ];
  const strength = Math.min(passed, 5);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password*"
          secureTextEntry
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={Colors.text}
        />
        <TouchableOpacity onPress={() => setShowRequirements(!showRequirements)} style={styles.iconBtn}>
          <Ionicons name="help-circle-outline" size={22} color={Colors.text_input} />
        </TouchableOpacity>
      </View>
 
      <View style={[styles.strengthBar, { backgroundColor: strengthColors[strength] }]} />
 
      {showRequirements && (
        <View style={styles.reqsContainer}>
          <Text style={[styles.req, reqs.length && styles.reqMet]}>• At least 8 characters</Text>
          <Text style={[styles.req, reqs.upper && styles.reqMet]}>• At least one uppercase letter</Text>
          <Text style={[styles.req, reqs.lower && styles.reqMet]}>• At least one lowercase letter</Text>
          <Text style={[styles.req, reqs.number && styles.reqMet]}>• At least one number</Text>
          <Text style={[styles.req, reqs.special && styles.reqMet]}>• At least one special character</Text>
        </View>
      )}
    </View>
  );
}


export default Password

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    marginTop: 0
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.border_color,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 5,
    marginTop: 0,
    backgroundColor: Colors.input_background ?? 'transparent',
  },
  input: {
    flex: 1,
    color: Colors.text_input,
    fontSize: 16,
  },
  iconBtn: {
    marginLeft: 8,
    padding: 4,
  },
  strengthBar: {
    height: 5,
    borderRadius: 3,
    width: '75%',
    alignSelf: 'center',
  },
  reqsContainer: {
    marginTop: 8,
  },
  req: {
    color: Colors.text,
    fontSize: 13,
  },
  reqMet: {
    color: Colors.success ?? '#00cc66',
    textDecorationLine: 'line-through',
  },
});
