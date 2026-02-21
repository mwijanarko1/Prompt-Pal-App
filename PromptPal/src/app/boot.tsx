import { View, Text, StyleSheet } from 'react-native';

export default function BootScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ROUTER MODE</Text>
      <Text style={styles.body}>Expo Router stack mounted. No tabs or app screens.</Text>
    </View>
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
