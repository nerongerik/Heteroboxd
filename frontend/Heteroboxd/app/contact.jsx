import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/Colors';
import { Link } from 'expo-router';
import * as Linking from 'expo-linking';

const Contact = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact Heteroboxd</Text>

      <Text style={styles.text}>
        Whether it's feedback, troubleshooting, business proposals, or general inquiries, we're here to help! Reach out to us at:
      </Text>
      <Text style={[styles.link, {alignSelf: 'center'}]} onPress={() => Linking.openURL('mailto:support@heteroboxd.com')}>
        support@heteroboxd.com
      </Text>

      <View style={styles.divider} />

      <Text style={styles.subtitle}>
        Note
      </Text>
      <Text style={styles.text}>
        Please keep in mind that Heteroboxd isn't a commercial entity, and the response times from our volunteers may vary.
        We should get back to you within 24 hours. In the meantime, feel free to check out our
        <Link style={[styles.link, {fontSize: 16}]} href='about'> FAQ</Link> for more information.
      </Text>
    </View>
  )
}

export default Contact

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "5%",
    paddingBottom: 50,
    backgroundColor: Colors.background,
  },
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
  },
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
});