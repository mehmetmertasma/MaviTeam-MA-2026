import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TeamSync</Text>

      <Text style={styles.title}>Welcome to TeamSync</Text>

      <Text style={styles.subtitle}>
        Manage schedules, teams, attendance, payments, and communication in one place.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/create-club')}>
        <Text style={styles.primaryButtonText}>Create / Manage a Club</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/join-club')}>
        <Text style={styles.secondaryButtonText}>Join a Club</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#38BDF8',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#0B1120',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    borderColor: '#38BDF8',
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
  },
});
