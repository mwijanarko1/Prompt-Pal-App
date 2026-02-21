import { View, Text, StyleSheet } from 'react-native';
import { ClerkProviderWrapper } from '@/lib/clerk';

export default function ClerkRoot() {
  return (
    <ClerkProviderWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>CLERK MODE</Text>
        <Text style={styles.body}>Clerk is enabled. No Convex or app screens.</Text>
      </View>
    </ClerkProviderWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#C7C7C7',
    fontSize: 14,
    textAlign: 'center',
  },
});
