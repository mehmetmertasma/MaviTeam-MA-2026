import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function JoinClubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TeamSync</Text>
      <Text style={styles.title}>Join a club</Text>
      <Text style={styles.subtitle}>
        Parents and athletes can join for free using a club code.
      </Text>

      <View style={styles.form}>
        <TextInput placeholder="Full Name" placeholderTextColor="#94A3B8" style={styles.input} />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        <TextInput
          autoCapitalize="characters"
          placeholder="Club Code"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Join Club</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    borderRadius: 14,
    marginTop: 10,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#0B1120',
    fontSize: 16,
    fontWeight: '700',
  },
});
