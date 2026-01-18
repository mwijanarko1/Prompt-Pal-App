import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View, Alert } from 'react-native'
import React from 'react'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        Alert.alert('Error', 'Sign in failed. Please try again.')
      }
    } catch (err: any) {
      // See Clerk docs: custom flows error handling
      // for more info on error handling
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign in failed')
    }
  }

  return (
    <View className="flex-1 bg-background p-6 justify-center">
      <Text className="text-onSurface text-3xl font-bold text-center mb-8">
        Sign in
      </Text>
      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        className="bg-surface border border-outline rounded-lg p-4 text-onSurface mb-4"
        keyboardType="email-address"
      />
      <TextInput
        value={password}
        placeholder="Enter password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
        className="bg-surface border border-outline rounded-lg p-4 text-onSurface mb-6"
      />
      <TouchableOpacity
        onPress={onSignInPress}
        className="bg-primary p-4 rounded-lg mb-6"
      >
        <Text className="text-onPrimary text-center font-semibold">Continue</Text>
      </TouchableOpacity>
      <View className="flex-row justify-center">
        <Text className="text-onSurfaceVariant">Don't have an account? </Text>
        <Link href="/(auth)/sign-up">
          <Text className="text-primary font-semibold">Sign up</Text>
        </Link>
      </View>
    </View>
  )
}