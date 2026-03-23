import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Feather from '@expo/vector-icons/Feather'
import { Colors } from '../constants/colors'
import HText from './htext'
 
const Password = ({ value, onChangeText, onValidityChange }) => {
  const [ showRequirements, setShowRequirements ] = useState(false)
  const [ showPassword, setShowPassword ] = useState(false)
  const { width } = useWindowDimensions()
  const [ border, setBorder ] = useState(false)

  const checkRequirements = (pw) => ({
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  })

  const reqs = checkRequirements(value || '')
  const passed = Object.values(reqs).filter(Boolean).length
  const isValid = Object.values(reqs).every(Boolean)

  useEffect(() => {
    onValidityChange(isValid)
  }, [isValid, onValidityChange])
 
  const strengthColors = [
    Colors.password_weak,
    Colors.password_meager,
    Colors.password_meh,
    Colors.password_solid,
    Colors.password_acceptable,
    Colors.password_strong,
  ]
  const strength = Math.min(passed, 5)

  return (
    <View style={{width: '100%'}}>
      <View style={[styles.inputContainer, {borderColor: border ? Colors.heteroboxd : Colors.border_color}]}>
        <TextInput
          style={[styles.input, {fontSize: width > 1000 ? 16 : 14, fontFamily: 'Inter_400Regular'}]}
          placeholder='Password*'
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={Colors.text}
          onFocus={() => setBorder(true)}
          onBlur={() => setBorder(false)}
        />
        <Pressable onPress={() => setShowPassword(showPassword ? false : true)} style={styles.iconBtn}>
          <Feather name={showPassword ? 'eye-off' : 'eye'} size={22} color={Colors.text_input} />
        </Pressable>
      </View>
      
      <View style={styles.strContainer}>
        <View style={[styles.strengthBar, { backgroundColor: strengthColors[strength] }]} />
        <Pressable onPress={() => setShowRequirements(!showRequirements)} style={styles.iconBtn}>
            <Ionicons name='help-circle-outline' size={22} color={Colors.text_input} />
        </Pressable>
      </View>
 
      {showRequirements && (
        <View style={styles.reqsContainer}>
          <HText style={[styles.req, reqs.length && styles.reqMet]}>• At least 8 characters</HText>
          <HText style={[styles.req, reqs.upper && styles.reqMet]}>• At least one uppercase letter</HText>
          <HText style={[styles.req, reqs.lower && styles.reqMet]}>• At least one lowercase letter</HText>
          <HText style={[styles.req, reqs.number && styles.reqMet]}>• At least one number</HText>
          <HText style={[styles.req, reqs.special && styles.reqMet]}>• At least one special character</HText>
        </View>
      )}
    </View>
  )
}


export default Password

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  }
})
