import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Text, TouchableOpacity, Alert } from 'react-native'

export const SignOutButton = () => {
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
              Linking.openURL(Linking.createURL('/'))
            } catch (err) {
              console.error(JSON.stringify(err, null, 2))
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          }
        }
      ]
    )
  }

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      className="bg-error px-4 py-2 rounded-xl active:bg-red-600"
    >
      <Text className="text-onPrimary text-sm font-semibold">Sign Out</Text>
    </TouchableOpacity>
  )
}