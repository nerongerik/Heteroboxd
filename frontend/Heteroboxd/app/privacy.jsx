import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Link } from 'expo-router'
import Head from 'expo-router/head'
import * as Linking from 'expo-linking'
import { Colors } from '../constants/colors'
import Divider from '../components/divider'
import HText from '../components/htext'

const Privacy = () => {
  const { width } = useWindowDimensions()

  return (
    <>
      <Head>
        <title>Privacy Policy</title>
        <meta name="description" content="Your data is safe with Heteroboxd!" />
        <meta property="og:title" content="Privacy Policy" />
        <meta property="og:description" content="Your data is safe with Heteroboxd!" />
        <link rel="icon" type="image/x-icon" href="https://www.heteroboxd.com/favicon.ico" />
        <link rel="icon" type="image/png" href="https://www.heteroboxd.com/favicon.png" sizes="48x48" />
      </Head>
      <View style={{ flex: 1, paddingBottom: 50, backgroundColor: Colors.background }}>
        <ScrollView
          contentContainerStyle={{ width: width > 1000 ? 1000 : width * 0.95, alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <HText style={styles.title}>Heteroboxd Privacy Policy</HText>
          <HText style={styles.lastUpdated}>
            Last Updated: April 12, 2026{' '}
            <HText style={styles.risen}>(Christ is Risen!)</HText>
          </HText>

          <HText style={styles.text}>
            Heteroboxd is{' '}
            <Link style={styles.link} href="https://github.com/nerongerik/Heteroboxd">open source</Link>
            , free to use, and developed solely by{' '}
            <Link style={styles.link} href="https://github.com/nerongerik">nerongerik</Link>
            . Your data is <HText style={styles.italic}>never</HText> sold or used for advertising.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>What We Collect</HText>
          <HText style={styles.text}>
            When creating an account, you provide the following information:
          </HText>
          {[
            'Username (your publicly displayed name)',
            'Email address (used to verify your account and identify you uniquely)',
            'Password (stored securely as a hashed value, never as plaintext)',
            'Gender (shown on your profile page)',
            'Bio (an optional description shown on your profile page)',
            'Profile picture (an optional avatar uploaded from your device)',
          ].map((item, i) => (
            <HText key={i} style={styles.bullet}>- {item}</HText>
          ))}

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>How It's Stored</HText>
          <HText style={styles.text}>
            Heteroboxd uses no cookies of any kind. Your authentication tokens are stored locally on your device via AsyncStorage. Your profile picture is stored on Cloudflare R2, and your profile data is stored on our server in PostgreSQL.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>Permissions</HText>
          <HText style={styles.text}>
            The only permission Heteroboxd requests is access to your photo gallery, solely to let you choose a profile picture. We do not access, read, or store anything else on your device.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>Donations</HText>
          <HText style={styles.text}>
            Heteroboxd earns no money from its services and follows TMDB API rules. Donations help cover maintenance costs and are not processed by us — we only link to our PayPal, Patreon, and Buy Me a Coffee pages.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>Your Rights</HText>
          <HText style={styles.text}>
            You have the right to view, edit, or permanently delete all data associated with your account at any time, with no retention.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>Children</HText>
          <HText style={styles.text}>
            Heteroboxd is not intended for users under the age of 13. We do not knowingly collect data from children.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>Changes to This Policy</HText>
          <HText style={styles.text}>
            If this policy changes, the updated version will be posted on this page with a new date.
          </HText>

          <Divider marginVertical={20} />

          <HText style={styles.subtitle}>Contact</HText>
          <HText style={styles.text}>
            For any questions, requests, or concerns regarding this policy:
          </HText>
          <Pressable onPress={() => Linking.openURL('mailto:support@heteroboxd.com')}>
            <HText style={[styles.link, { textAlign: 'center', fontSize: 18, marginTop: 5 }]}>
              support@heteroboxd.com
            </HText>
          </Pressable>

        </ScrollView>
      </View>
    </>
  )
}

export default Privacy

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    color: Colors.text_title,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  risen: {
    fontStyle: 'italic',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text_title,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '350',
    marginBottom: 5,
    color: Colors.text,
    textAlign: 'center',
  },
  bullet: {
    fontSize: 16,
    fontWeight: '350',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 3,
  },
  link: {
    color: Colors.text_link,
    fontWeight: '500',
    fontSize: 16,
  },
  italic: {
    fontStyle: 'italic',
  },
})