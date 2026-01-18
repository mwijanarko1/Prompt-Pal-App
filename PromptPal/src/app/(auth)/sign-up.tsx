import * as React from 'react'
import { Text, TextInput, TouchableOpacity, View, Alert } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err: any) {
      // See Clerk docs: custom flows error handling
      // for more info on error handling
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to create account')
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        Alert.alert('Error', 'Verification failed. Please try again.')
      }
    } catch (err: any) {
      // See Clerk docs: custom flows error handling
      // for more info on error handling
      Alert.alert('Error', err.errors?.[0]?.message || 'Verification failed')
    }
  }

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-background p-6 justify-center">
        <Text className="text-onSurface text-2xl font-bold text-center mb-8">
          Verify your email
        </Text>
        <Text className="text-onSurfaceVariant text-center mb-6">
          We've sent a verification code to your email
        </Text>
        <TextInput
          value={code}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
          className="bg-surface border border-outline rounded-lg p-4 text-onSurface mb-6"
          keyboardType="numeric"
        />
        <TouchableOpacity
          onPress={onVerifyPress}
          className="bg-primary p-4 rounded-lg"
        >
          <Text className="text-onPrimary text-center font-semibold">Verify</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-background p-6 justify-center">
      <Text className="text-onSurface text-3xl font-bold text-center mb-8">
        Sign up
      </Text>
      <TextInput
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        onChangeText={(email) => setEmailAddress(email)}
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
        onPress={onSignUpPress}
        className="bg-primary p-4 rounded-lg mb-6"
      >
        <Text className="text-onPrimary text-center font-semibold">Continue</Text>
      </TouchableOpacity>
      <View className="flex-row justify-center">
        <Text className="text-onSurfaceVariant">Already have an account? </Text>
        <Link href="/(auth)/sign-in">
          <Text className="text-primary font-semibold">Sign in</Text>
        </Link>
      </View>
    </View>
  )
}