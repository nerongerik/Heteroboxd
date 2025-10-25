import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { Colors } from '../constants/Colors';
import { Link } from 'expo-router';

const About = () => {
  return (
    <View style={styles.container}>
    <ScrollView
      contentContainerStyle={{ padding: "3%" }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>About
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd</Text>
      </Text>

      <Text style={styles.subtitle}>What is
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd</Text>
        ?
      </Text>
      <Text style={styles.text}>
        Heteroboxd is a social film discovery app for reactionaries, political extremists, and religious
        fundamentalists (normal movie-goers from 30 years ago). It was designed to be an open-source
        alternative to<Text style={{ fontStyle: "italic" }}> *certain* </Text>proprietary platforms that
        have become overrun with progressive propaganda and censorship.
      </Text>

      <Text style={styles.subtitle}>
        Is
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        available on all devices?
      </Text>
      <Text style={styles.text}>
        You can download our mobile app for both iOS and Android devices from their respective app stores,
        or access Heteroboxd via any web browser at <Link style={styles.link} href='https://heteroboxd.com'>heteroboxd.com</Link>.
      </Text>

      <Text style={styles.subtitle}>How does
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        work?
      </Text>
      <Text style={styles.text}>  
        You can track, rate, and review the films you've seen, or add new ones to your Watchlist. Share your criticism,
        interact with other like-minded users, or create your own custom lists - be they ranked, thematic, or just for fun!
      </Text>

      <Text style={styles.subtitle}>Is
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        a wild-west platform?
      </Text>
      <Text style={styles.text}>  
        Yes... and no. Heteroboxd enforces no speech restrictions per se, but remains very serious about both the privacy of its
        users and the integrity of the founding vision. The community is encouraged to report any behavior that threatens these
        core tenets (e.g. doxxing, faggotry) so they can recieve the treatment that all utter woke nonsense deserves.
      </Text>

      <Text style={styles.subtitle}>
        Does
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        have guidelines?
      </Text>
      <Text style={styles.text}>
        Yes! Unlike our competitors, Heteroboxd is 100% transparent with its <Link style={styles.link} href='guidelines'>code of conduct.</Link>
      </Text>

      <Text style={styles.subtitle}>
        How do I contact
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        support?
      </Text>
      <Text style={styles.text}>
        Please see the details on our <Link style={styles.link} href='contact'>contact page.</Link>
      </Text>

      <Text style={styles.subtitle}>
        Where does
        <Text style={{color: Colors.hetero}}> Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        get its films?
      </Text>
      <Text style={styles.text}>
        Heteroboxd's film database is powered by the one and only tMDB API, wherefrom we source all film metadata and images
        in regular syncs.
      </Text>

      <View style={styles.divider} />

      <Text style={[styles.text, {textAlign: "center", fontWeight: "800", marginTop: "5%"}]}>  
        <Text style={{color: Colors.hetero}}>Hetero</Text>
        <Text style={{color: Colors.boxd}}>boxd </Text>
        - developed by <Link style={[styles.link, {fontWeight: "800"}]} href='https://youtube.com/@nerongerik'>nerongerik</Link>
      </Text>
    </ScrollView>
    </View>
  )
}

export default About

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: Colors.text_title,
    textAlign: "left",
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.border_color,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    color: Colors.text_input,
  },
  button: {
    backgroundColor: Colors.button,
    width: "75%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: Colors.text_button,
    fontWeight: "600",
  },
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.text,
    textAlign: "justify"
  },
  link: {
    color: Colors.text_link,
    fontWeight: "500",
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