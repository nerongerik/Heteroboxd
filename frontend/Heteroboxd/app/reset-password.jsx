import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react';
import { Colors } from '../constants/colors';
import Password from '../components/password';
import { BaseUrl } from '../constants/api';
import LoadingResponse from '../components/loadingResponse';
import Popup from '../components/popup';

const PasswordReset = () => {
  const {userId, token} = useLocalSearchParams();
  const rawToken = Array.isArray(token) ? token[0] : token;
  const decodedToken = decodeURIComponent(rawToken);
  const [password, setPassword] = useState('');
  const [pwValid, setPwValid] = useState(false);

  const {width} = useWindowDimensions();
  const router = useRouter();

  const [response, setResponse] = useState(-1);
  const [message, setMessage] = useState('');

  const handleReset = async () => {
    try {
      setResponse(0);
      const res = await fetch(`${BaseUrl.api}/auth/reset-password`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          'UserId': userId,
          'Token': decodedToken,
          'NewPassword': password
        })
      });
      if (res.status === 200) {
        setResponse(200);
        router.replace('/login');
      } else {
        setResponse(res.status);
        setMessage('Something went wrong! Please try again later, or contact Heteroboxd support for more help.');
      }
    } catch {
      setResponse(500);
      setMessage('Network error! Please check your internet connection.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={{width: Math.min(width*0.95, 1000), alignSelf: 'center'}}>
        <Text style={{color: Colors.text_title, fontSize: 20, textAlign: 'center', padding: 10}}>Almost there! Enter your new password:</Text>
        <Password value={password} onChangeText={setPassword} onValidityChange={setPwValid} />
        <TouchableOpacity
          disabled={!pwValid}
          onPress={handleReset}
          style={[
            {backgroundColor: Colors.button, alignSelf: 'center', borderRadius: 3},
            (!pwValid) && {opacity: 0.5}
          ]}
        >
          <Text style={{color: Colors.text_button, paddingHorizontal: 10, paddingVertical: 5, fontSize: 16}}>Confirm</Text>
        </TouchableOpacity>
      </View>

      <Popup
        visible={![-1, 0, 200].includes(response)}
        message={message}
        onClose={() => {router.replace('/contact')}}
      />
      <LoadingResponse visible={response === 0} />
    </View>
  )
}

export default PasswordReset

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingBottom: 50
  },
})