import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Colors } from '../constants/colors'
import HText from '../components/htext'

const Guidelines = () => {
  const { width } = useWindowDimensions()

  return (
    <View style={{flex: 1, paddingBottom: 50, backgroundColor: Colors.background, alignContent: 'center', justifyContent: 'center'}}>
      <ScrollView
        contentContainerStyle={{width: width > 1000 ? 1000 : width*0.95, alignSelf: 'center'}}
        showsVerticalScrollIndicator={false}
      >
        <HText style={styles.title}>
          Heteroboxd{"\n"}Community Guidelines
        </HText>

        <HText style={styles.subtitle}>
          Rule 1: No Doxxing!
        </HText>
        <HText style={styles.text}>
          You like free speech? Great! Let's all help each other keep our rights to it — as on the internet, so in reality.
          We allow our users to share or withhold as much about themselves as they like, which doesn't extend to sharing private
          information about others.
        </HText>

        <HText style={styles.subtitle}>
          Rule 2: No Queershipping!
        </HText>
        <HText style={styles.text}>
          Heteroboxd is a social film discovery platform, not a mental institution. There are plenty of other places on the internet
          that seem to be specifically suited to the alphabet community and their various fetishes — this isn't one of them. "Shipping"
          film characters of the same gender (or their actors, for that matter) is strictly prohibited.
        </HText>

        <HText style={styles.subtitle}>
          Rule 3: No Simping!
        </HText>
        <HText style={styles.text}>
          We firmly believe that we should ALL know less about each other. Keep your sexual preferences, kinks, and fetishes to yourself.
          This is an app for MOVIES, not a Red-light district — drooling over fictional characters doesn't constitute a critique.{'\n\n'}
          <HText style={[styles.text, { fontStyle: "italic" }]}>(this rule doesn't apply for Ryan Gosling, of course)</HText>
        </HText>

        <HText style={styles.subtitle}>
          Rule 4: No Blasphemy!
        </HText>
        <HText style={styles.text}>
          Any defamation against our Lord and saviour Jesus Christ, his holy mother, or the saints will be punished (for your own good).
        </HText>

        <HText style={styles.subtitle}>
          Rule 5: No One-Liners!
        </HText>
        <HText style={styles.text}>
          The trend of "quirky" one-liners consisting entirely of millenial humor that prevails in reviews on
          <HText style={[styles.text, { fontStyle: "italic" }]}> *certain* </HText>
          platforms will not be allowed to spread here. If the other users find your reviews to lack quality and/or humor, we encourage them
          to report it, so you can be properly penalized.
        </HText>

        <HText style={styles.subtitle}>
          Rule 6: Speak Freely!
        </HText>
        <HText style={styles.text}>
          Don't be a woketard, but don't fedpost either. Write what you mean, and mean what you write — simple as.
        </HText>
      </ScrollView>
    </View>
  )
}

export default Guidelines

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
    fontWeight: "400",
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