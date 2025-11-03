import { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Feather from '@expo/vector-icons/Feather';
 
const Password = ({ value, onChangeText, onValidityChange }) => {
  const [showRequirements, setShowRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={Colors.text}
        />
        {
          !showPassword ? (
            <TouchableOpacity onPress={() => setShowPassword(true)} style={styles.iconBtn}>
              <Feather name="eye" size={22} color={Colors.text_input} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setShowPassword(false)} style={styles.iconBtn}>
              <Feather name="eye-off" size={22} color={Colors.text_input} />
            </TouchableOpacity>
          )
        }
      </View>
      
      <View style={styles.strContainer}>
        <View style={[styles.strengthBar, { backgroundColor: strengthColors[strength] }]} />
        <TouchableOpacity onPress={() => setShowRequirements(!showRequirements)} style={styles.iconBtn}>
            <Ionicons name="help-circle-outline" size={22} color={Colors.text_input} />
        </TouchableOpacity>
      </View>
 
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.border_color,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    backgroundColor: 'transparent',
  },
  strContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: '100%',
    marginBottom: 0
  },
  input: {
    flex: 1,
    color: Colors.text_input,

    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  iconBtn: {
    marginLeft: 8,
    padding: 4,
    alignSelf: 'center'
  },
  strengthBar: {
    height: 5,
    borderRadius: 3,
    width: '75%',
    alignSelf: 'center',
  },
  reqsContainer: {
    marginTop: 0,
    marginBottom: 15,
  },
  req: {
    color: Colors.text,
    fontSize: 13,
  },
  reqMet: {
    color: Colors.success,
    textDecorationLine: 'line-through',
  },
});
