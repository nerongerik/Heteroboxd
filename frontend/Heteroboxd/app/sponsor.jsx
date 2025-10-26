import { StyleSheet, Text, View, Image } from 'react-native'
import { Colors } from '../constants/Colors';

const Sponsor = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Donate to Heteroboxd
      </Text>

      <Text style={styles.text}>
        Heteroboxd is open-source and free to use, but annual maintanance and server costs do add up.
        If you'd like to support the project and help cover these costs, please consider making a donation.
      </Text>

      {/* PayPal or Stripe donation form */}
      <Image source={require('../assets/default-profile.png')} />

      <Text style={styles.text}>
        As an added bonus to show our appreciation, all people who donate will recieve a special badge next to their
        profile name, as well as highlighted reviews and comments for 365 days after the donation is processed.
      </Text>

      <Text style={styles.text}>
        Furthermore, donating more than $50 at a time will mark you as a PATRON for life, long after the 365 days expire!
      </Text>
    </View>
  )
}

export default Sponsor

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
  divider: {
    height: 1.5,
    backgroundColor: Colors.border_color,
    marginVertical: 20,
    width: "75%",
    alignSelf: "center",
    opacity: 0.5,
  },
});