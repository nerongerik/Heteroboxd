import { StyleSheet, Text, View, ScrollView, Platform, useWindowDimensions } from 'react-native'
import { Colors } from '../constants/colors'

const Guidelines = () => {

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
          Heteroboxd{"\n"}Community Guidelines
        </Text>

        <Text style={styles.subtitle}>
          Rule 1: No Doxxing!
        </Text>
        <Text style={styles.text}>
          You like free speech? Great! Let's all help each other keep our rights to it — as on the internet, so in reality.
          We allow our users to share or withhold as much about themselves as they like, which doesn't extend to sharing private
          information about others.
        </Text>

        <Text style={styles.subtitle}>
          Rule 2: No Queershipping!
        </Text>
        <Text style={styles.text}>
          Heteroboxd is a social film discovery platform, not a mental institution. There are plenty of other places on the internet
          that seem to be specifically suited to the alphabet community and their various fetishes — this isn't one of them. "Shipping"
          film characters of the same gender (or their actors, for that matter) is strictly prohibited.
        </Text>

        <Text style={styles.subtitle}>
          Rule 3: No Simping!
        </Text>
        <Text style={styles.text}>
          We firmly believe that we should ALL know less about each other. Keep your sexual preferences, kinks, and fetishes to yourself.
          This is an app for MOVIES, not a Red-light district — drooling over fictional characters doesn't constitute a critique.{'\n\n'}
          <Text style={[styles.text, { fontStyle: "italic" }]}>(this rule doesn't apply for Ryan Gosling, of course)</Text>
        </Text>

        <Text style={styles.subtitle}>
          Rule 4: No Blasphemy!
        </Text>
        <Text style={styles.text}>
          Any defamation against our Lord and saviour Jesus Christ, his holy mother, or the saints will be punished (for your own good).
        </Text>

        <Text style={styles.subtitle}>
          Rule 5: No One-Liners!
        </Text>
        <Text style={styles.text}>
          The trend of "quirky" one-liners consisting entirely of millenial humor that prevails in reviews on
          <Text style={[styles.text, { fontStyle: "italic" }]}> *certain* </Text>
          platforms will not be allowed to spread here. If the other users find your reviews to lack quality and/or humor, we encourage them
          to report it, so you can be properly penalized.
        </Text>

        <Text style={styles.subtitle}>
          Rule 6: Speak Freely!
        </Text>
        <Text style={styles.text}>
          Don't be a woketard, but don't fedpost either. Write what you mean, and mean what you write — simple as.
        </Text>
      </ScrollView>
    </View>
  )
}

export default Guidelines

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