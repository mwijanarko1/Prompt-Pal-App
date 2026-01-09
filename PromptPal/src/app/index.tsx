import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{
          color: '#FF770F',
          fontSize: 48,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Prompt
        </Text>
        <Text style={{
          color: '#553EFF',
          fontSize: 48,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Pal
        </Text>
      </View>
    </View>
  );
}
