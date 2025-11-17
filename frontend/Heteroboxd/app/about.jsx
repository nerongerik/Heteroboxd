import { StyleSheet, Text, View, ScrollView, Platform, useWindowDimensions } from 'react-native'
import { Link } from 'expo-router';
import { Colors } from '../constants/colors';

const About = () => {

  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 15,
          minWidth: Platform.OS === 'web' && width > 1000 ? 1000 : 'auto',
          maxWidth: Platform.OS === "web" && width > 1000 ? 1000 : "100%",
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          About Heteroboxd
        </Text>
    
        <Text style={styles.subtitle}>
          What is Heteroboxd?
        </Text>
        <Text style={styles.text}>
          Heteroboxd is a social film discovery app for reactionaries, political extremists, and religious
          fundamentalists (normal movie-lovers from 30 years ago). It was designed to be an open-source
          alternative to
          <Text style={{ fontStyle: "italic" }}> *certain* </Text>proprietary platforms that
          have become overrun with progressive propaganda and censorship.
        </Text>
    
        <Text style={styles.subtitle}>
          Is Heteroboxd available on all devices?
        </Text>
        <Text style={styles.text}>
          You can access Heteroboxd via any web browser at <Link style={styles.link} href='https://heteroboxd.com'>heteroboxd.com</Link>,
          or download our mobile app from the Google Play Store. The iOS version of the app is already developed, but due to the massive
          costs of Apple's developer program and App Store fees, it won't be published until we reach sufficient interest
          <Link style={styles.link} href='sponsor'> and funding.</Link>
        </Text>

        <Text style={styles.subtitle}>
          Why is Heteroboxd so slow?
        </Text>
        <Text style={styles.text}>
          Heteroboxd is an open-source project developed without profits out of the kindness of our hearts. We pay for the servers from
          our own pocket, and unless you choose to support us with <Link style={styles.link} href='sponsor'>donations</Link>,
          getting faster service will not be feasible.
        </Text>
    
        <Text style={styles.subtitle}>
          How does Heteroboxd work?
        </Text>
        <Text style={styles.text}>  
          You can track, rate, and review the films you've seen, or add new ones to your watchlist. Share your criticism,
          interact with other like-minded users, or create your own custom lists - be they ranked, thematic, or just for fun!
        </Text>
    
        <Text style={styles.subtitle}>
          Is Heteroboxd a wild-west platform?
        </Text>
        <Text style={styles.text}>  
          Yes... and no. Heteroboxd enforces no speech restrictions per se, but remains very serious about both the privacy of its
          users and the integrity of the founding vision. The community is encouraged to report any behavior that threatens these
          core tenets so they can recieve the treatment that all utter woke nonsense deserves.
        </Text>
    
        <Text style={styles.subtitle}>
          Does Heteroboxd have guidelines?
        </Text>
        <Text style={styles.text}>
          Yes! Unlike our competitors, Heteroboxd is 100% transparent with its <Link style={styles.link} href='guidelines'>code of conduct.</Link>
        </Text>
    
        <Text style={styles.subtitle}>
          How do I contact Heteroboxd support?
        </Text>
        <Text style={styles.text}>
          Please see the details on our <Link style={styles.link} href='contact'>contact page.</Link>
        </Text>
    
        <Text style={styles.subtitle}>
          Where does Heteroboxd get films from?
        </Text>
        <Text style={styles.text}>
          Heteroboxd's film database is powered by the one and only tMDB API, wherefrom we source all film metadata and images
          in regular syncs. tMDB does not endorse Heteroboxd.
        </Text>
    
        <Text style={styles.subtitle}>
          How can I support Heteroboxd?
        </Text>
        <Text style={styles.text}>
          Heteroboxd is open source and free to use for all, and the (many) expenses are currently covered by the developer.
          If you'd like to support the project, please consider supporting the cause with <Link style={styles.link} href='sponsor'>a donation</Link>.
        </Text>
    
        <View style={styles.divider} />
    
        <Text style={[styles.text, {textAlign: "center", fontWeight: "800", marginTop: "5%"}]}>  
          Heteroboxd - developed by <Link style={[styles.link, {fontWeight: "800"}]} href='https://github.com/nerongerik'>nerongerik</Link>
        </Text>
      </ScrollView>
    </View>
  )
}

export default About

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingBottom: 50,
    backgroundColor: Colors.background,
    alignContent: 'center',
    justifyContent: 'center',
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
  text: {
    fontWeight: "350",
    marginTop: 5,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.text,
    textAlign: "left",
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