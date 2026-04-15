import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Link } from 'expo-router'
import Head from 'expo-router/head'
import { Colors } from '../constants/colors'
import HText from '../components/htext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const About = () => {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return (
    <>
    <Head>
      <title>About</title>
      <meta name="description" content="What is Heterobox, how does it work, and other frequently asked questions..." />
      <meta property="og:title" content="About" />
      <meta property="og:description" content="What is Heterobox, how does it work, and other frequently asked questions..." />
      <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
      <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
    </Head>
    <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background, alignContent: 'center', justifyContent: 'center'}}>
      <ScrollView
        contentContainerStyle={{width: width > 1000 ? 1000 : width*0.95, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
      >
        <HText style={styles.title}>
          About Heteroboxd
        </HText>
    
        <HText style={styles.subtitle}>
          What is Heteroboxd?
        </HText>
        <HText style={styles.text}>
          Heteroboxd is a free-speech, social film discovery platform. It was designed to be an open-source
          alternative to<HText style={{ fontStyle: "italic" }}> certain </HText>proprietary platforms that
          have become cesspits of progressive propaganda and censorship in the last few years.
        </HText>

        <HText style={styles.subtitle}>
          How does Heteroboxd work?
        </HText>
        <HText style={styles.text}>  
          You can track, rate, and review the films you've seen, or add new ones to your watchlist. Share your criticism,
          interact with like-minded users, or create your own custom lists - be they ranked, thematic, or just for fun!
        </HText>

        <HText style={styles.subtitle}>
          Is Heteroboxd a wild-west platform?
        </HText>
        <HText style={styles.text}>  
          Yes... and no. Heteroboxd enforces no speech restrictions per se, but retains the right to silence any behavior that threatens
          the privacy of our users, endangers the founding vision, or blasphemes the good name of our Lord and Savior, Jesus Christ.
        </HText>

        <HText style={styles.subtitle}>
          Where does Heteroboxd get its films from?
        </HText>
        <HText style={styles.text}>
          Heteroboxd's film database is powered by the one and only tMDB API, wherefrom we source all film metadata and images
          in regular syncs. tMDB does not endorse Heteroboxd.
        </HText>
    
        <HText style={styles.subtitle}>
          Is Heteroboxd available on all devices?
        </HText>
        <HText style={styles.text}>
          You can access Heteroboxd on any web browser at <Link style={styles.link} href='https://www.heteroboxd.com'>heteroboxd.com</Link>,
          or download our mobile app from the Google Play Store. The iOS build is ready for deployment, but due to massive
          costs of Apple's developer program and App Store fees, it won't be published until we reach sufficient interest and
          <Link style={styles.link} href='/sponsor'> funding.</Link>
        </HText>
    
        <HText style={styles.subtitle}>
          How can I support Heteroboxd?
        </HText>
        <HText style={styles.text}>
          Heteroboxd is free to use for everyone, and the (many) expenses are currently covered by the developer.
          If you'd like to support us, please consider making <Link style={styles.link} href='sponsor'>a donation</Link>.
        </HText>

        <HText style={styles.subtitle}>
          My privacy on Heteroboxd?
        </HText>
        <HText style={styles.text}>
          You data is safe with us. To read our full privacy policy, click <Link style={styles.link} href='https://heteroboxd.com/privacy'>here</Link>.
        </HText>

        <HText style={styles.subtitle}>
          How do I contact Heteroboxd support?
        </HText>
        <HText style={styles.text}>
          Please see the details on our <Link style={styles.link} href='/contact'>contact page.</Link>
        </HText>
    
        <HText style={[styles.text, {textAlign: 'center', fontWeight: '800', marginTop: 50, marginBottom: insets.bottom}]}>  
          Heteroboxd - developed by <Link style={[styles.link, {fontWeight: '800'}]} href='https://github.com/nerongerik'>nerongerik</Link>
        </HText>
      </ScrollView>
    </View>
    </>
  )
}

export default About

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
  }
})
