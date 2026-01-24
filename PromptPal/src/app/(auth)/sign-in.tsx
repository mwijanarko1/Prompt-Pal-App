import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, View, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({})

  // Validate form inputs
  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {}

    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded || isLoading) return

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

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
        setErrors({ general: 'Sign in failed. Please try again.' })
      }
    } catch (err) {
      // See Clerk docs: custom flows error handling
      const errorMessage = (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as { errors?: Array<{ message?: string }> }).errors))
        ? (err as { errors: Array<{ message?: string }> }).errors[0]?.message || 'Sign in failed'
        : 'Sign in failed'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
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
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-surfaceVariant/50 rounded-2xl items-center justify-center mb-6 border border-outline/20">
              <Ionicons name="lock-closed" size={32} color="#FF6B00" />
            </View>
            <View className="flex-row items-center mb-3">
              <Text className="text-primary text-4xl font-bold tracking-tight">Prompt</Text>
              <Text className="text-secondary text-4xl font-bold tracking-tight">Pal</Text>
            </View>
            <Text className="text-onSurfaceVariant text-center text-base">
              Enter your credentials to continue{'\n'}your engineering journey
            </Text>
          </View>

          {/* Sign In Form */}
          <View className="bg-surface border border-outline/20 rounded-[32px] p-8 shadow-2xl shadow-black/50 mb-8">
            <Text className="text-onSurface text-2xl font-bold mb-8 text-center">
              Welcome Back
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
                    className="flex-1 ml-3 text-onSurface text-base"
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
                    className="flex-1 ml-3 text-onSurface text-base"
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

            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              className={`bg-primary h-16 rounded-2xl items-center justify-center mt-10 shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sign In</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity className="mt-4 self-center">
              <Text className="text-onSurfaceVariant text-xs font-medium">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center mb-10">
            <Text className="text-onSurfaceVariant text-base">
              Don't have an account?
            </Text>
            <Link href="/(auth)/sign-up" className="ml-2">
              <Text className="text-primary text-base font-bold">
                Create Account
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}