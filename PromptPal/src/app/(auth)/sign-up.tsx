import * as React from 'react'
import { Text, View, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Button, Input, Card } from '@/components/ui'
import { Ionicons } from '@expo/vector-icons'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    code?: string;
    general?: string
  }>({})

  // Validate sign-up form
  const validateSignUpForm = () => {
    const newErrors: {email?: string; password?: string} = {}

    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate verification form
  const validateVerificationForm = () => {
    const newErrors: {code?: string} = {}

    if (!code.trim()) {
      newErrors.code = 'Verification code is required'
    } else if (code.length !== 6 || !/^\d+$/.test(code)) {
      newErrors.code = 'Please enter a valid 6-digit code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded || isLoading) return

    if (!validateSignUpForm()) return

    setIsLoading(true)
    setErrors({})

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
      const errorMessage = err.errors?.[0]?.message || 'Failed to create account'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded || isLoading) return

    if (!validateVerificationForm()) return

    setIsLoading(true)
    setErrors({})

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
        setErrors({ general: 'Verification failed. Please try again.' })
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Verification failed'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
            className="px-6"
          >
            {/* Header */}
            <View className="items-center mb-10">
              <View className="w-16 h-16 bg-info/10 rounded-2xl items-center justify-center mb-6 border border-info/20">
                <Ionicons name="mail-unread" size={32} color="#06B6D4" />
              </View>
              <Text className="text-white text-3xl font-bold mb-3 tracking-tight">
                Verify Email
              </Text>
              <Text className="text-onSurfaceVariant text-center text-base px-10">
                We've sent a 6-digit code to{'\n'}<Text className="text-white font-bold">{emailAddress}</Text>
              </Text>
            </View>

            {/* Verification Form */}
            <View className="bg-surface border border-outline/20 rounded-[32px] p-8 shadow-2xl shadow-black/50 mb-8">
              {errors.general && (
                <View className="bg-error/10 border border-error/30 rounded-2xl p-4 mb-6">
                  <Text className="text-error text-sm text-center font-medium">
                    {errors.general}
                  </Text>
                </View>
              )}

              <View className="mb-8">
                <Text className="text-onSurfaceVariant text-xs font-bold uppercase mb-4 ml-1 tracking-wider text-center">Enter 6-Digit Code</Text>
                <View className={`bg-surfaceVariant/50 border ${errors.code ? 'border-error' : 'border-outline/30'} rounded-2xl px-4 py-5 items-center`}>
                  <TextInput
                    className="text-white text-4xl font-bold tracking-[10px] text-center w-full"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text.replace(/[^0-9]/g, '').slice(0, 6))
                      if (errors.code) setErrors({ ...errors, code: undefined })
                    }}
                    placeholder="000000"
                    placeholderTextColor="#4B5563"
                    keyboardType="numeric"
                    autoFocus
                  />
                </View>
                {errors.code && <Text className="text-error text-[10px] mt-1.5 text-center font-medium">{errors.code}</Text>}
              </View>

              <TouchableOpacity
                onPress={onVerifyPress}
                disabled={isLoading}
                className={`bg-primary h-16 rounded-2xl items-center justify-center shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70' : ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Verify & Join</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPendingVerification(false)}
                className="mt-6 py-2 items-center"
              >
                <Text className="text-onSurfaceVariant text-sm font-medium">Back to Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          {/* Decorative Background Elements */}
          <View className="absolute top-0 left-0 w-40 h-40 bg-secondary/5 rounded-full" />
          <View className="absolute bottom-20 right-[-20] w-60 h-60 bg-primary/5 rounded-full" />

          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-secondary/10 rounded-2xl items-center justify-center mb-6 border border-secondary/20">
              <Ionicons name="person-add" size={32} color="#06B6D4" />
            </View>
            <View className="flex-row items-center mb-3">
              <Text className="text-secondary text-4xl font-bold tracking-tight">Prompt</Text>
              <Text className="text-white text-4xl font-bold tracking-tight">Pal</Text>
            </View>
            <Text className="text-onSurfaceVariant text-center text-base">
              Create an account to start your{'\n'}mastery journey
            </Text>
          </View>

          {/* Sign Up Form */}
          <View className="bg-surface border border-outline/20 rounded-[32px] p-8 shadow-2xl shadow-black/50 mb-8">
            <Text className="text-white text-2xl font-bold mb-8 text-center">
              Sign Up
            </Text>

            {errors.general && (
              <View className="bg-error/10 border border-error/30 rounded-2xl p-4 mb-6">
                <Text className="text-error text-sm text-center font-medium">
                  {errors.general}
                </Text>
              </View>
            )}

            <View className="space-y-5">
              <View>
                <Text className="text-onSurfaceVariant text-xs font-bold uppercase mb-2 ml-1 tracking-wider">Email Address</Text>
                <View className={`bg-surfaceVariant/50 border ${errors.email ? 'border-error' : 'border-outline/30'} rounded-2xl px-4 py-4 flex-row items-center`}>
                  <Ionicons name="mail-outline" size={20} color={errors.email ? "#EF4444" : "#9CA3AF"} />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    value={emailAddress}
                    onChangeText={(text) => {
                      setEmailAddress(text)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    placeholder="name@example.com"
                    placeholderTextColor="#4B5563"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email && <Text className="text-error text-[10px] mt-1.5 ml-1 font-medium">{errors.email}</Text>}
              </View>

              <View>
                <Text className="text-onSurfaceVariant text-xs font-bold uppercase mb-2 ml-1 tracking-wider">Password</Text>
                <View className={`bg-surfaceVariant/50 border ${errors.password ? 'border-error' : 'border-outline/30'} rounded-2xl px-4 py-4 flex-row items-center`}>
                  <Ionicons name="key-outline" size={20} color={errors.password ? "#EF4444" : "#9CA3AF"} />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#4B5563"
                    secureTextEntry
                  />
                </View>
                {errors.password && <Text className="text-error text-[10px] mt-1.5 ml-1 font-medium">{errors.password}</Text>}
              </View>
            </View>

            <View className="bg-surfaceVariant/30 rounded-2xl p-4 mt-6">
              <Text className="text-onSurfaceVariant text-[10px] leading-4 font-medium">
                • 8+ characters, uppercase, lowercase, and a number.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={isLoading}
              className={`bg-secondary h-16 rounded-2xl items-center justify-center mt-8 shadow-lg shadow-secondary/20 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center mb-10">
            <Text className="text-onSurfaceVariant text-base">
              Already have an account?
            </Text>
            <Link href="/(auth)/sign-in" className="ml-2">
              <Text className="text-secondary text-base font-bold">
                Sign In
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}