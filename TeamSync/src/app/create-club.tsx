import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateClubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>TeamSync</Text>
      <Text style={styles.title}>Create your club</Text>
      <Text style={styles.subtitle}>
        Club owners can create a club account. This account will become the Club Admin later.
      </Text>

      <View style={styles.form}>
        <TextInput placeholder="Club Name" placeholderTextColor="#94A3B8" style={styles.input} />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Create Club</Text>
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
