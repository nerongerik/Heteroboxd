import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Link } from 'expo-router'
import * as Linking from 'expo-linking'
import { Colors } from '../constants/colors'
import Divider from '../components/divider'
import HText from '../components/htext'

const Contact = () => {
  const { width } = useWindowDimensions()

  return (
    <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background}}>
      <ScrollView
        contentContainerStyle={{width: width > 1000 ? 1000 : width*0.95, flexGrow: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
      >
        <HText style={styles.title}>Contact Heteroboxd</HText>

        <HText style={styles.text}>
          Whether it's feedback, troubleshooting, business proposals, or general inquiries, we're here to help! Reach out to us at:
        </HText>
        <Pressable style={{alignSelf: 'center'}} onPress={() => Linking.openURL('mailto:support@heteroboxd.com')}>
          <HText style={[styles.link, {textAlign: 'center'}]}>support@heteroboxd.com</HText>
        </Pressable>

        <Divider marginVertical={20} />

        <HText style={styles.subtitle}>
          Note
        </HText>
        <HText style={styles.text}>
          Please keep in mind that Heteroboxd isn't a commercial entity, and the response times from our volunteers may vary.
          We should get back to you within 24 hours. In the meantime, feel free to check out our
          <Link style={[styles.link, {fontSize: 16}]} href='/about'> FAQ</Link> for more information.
        </HText>
      </ScrollView>
    </View>
  )
}

export default Contact

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
    color: Colors.text_title,
    textAlign: "center"
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 0,
    marginTop: '3%',
    color: Colors.text_title,
    textAlign: "center",
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: '1%',
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
  link: {
    color: Colors.text_link,
    fontWeight: "500",
    marginTop: 0,
    fontSize: 18,
    marginBottom: '3%',
  }
})