import { useAuth, useSignIn, useSSO } from '@clerk/clerk-expo'
import { Link, Redirect, useRouter } from 'expo-router'
import { Text, View, KeyboardAvoidingView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState, useCallback, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { GoogleIcon } from '@/components/GoogleIcon'
import * as WebBrowser from 'expo-web-browser'
import { logger } from '@/lib/logger'
import { getClerkErrorMessage, getOAuthRedirectCandidates } from '@/lib/oauthRedirect'

// Browser warming hook for better OAuth UX
const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync().catch(() => undefined)
    return () => {
      void WebBrowser.coolDownAsync().catch(() => undefined)
    }
  }, [])
}

WebBrowser.maybeCompleteAuthSession()

export default function SignInScreen() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { signIn, setActive, isLoaded } = useSignIn()
  const { startSSOFlow } = useSSO()
  const router = useRouter()

  useWarmUpBrowser()

  // If already signed in (e.g. from race with tabs redirect), go straight to app
  if (isAuthLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  // Validate form inputs
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}

    if (!emailAddress.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
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
      const identifier = emailAddress.trim()
      const signInAttempt = await signIn.create({
        identifier,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        setTimeout(() => router.replace('/(tabs)'), 500)
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        setErrors({ general: 'Sign in failed. Please try again.' })
      }
    } catch (err) {
      const errStr = err && typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
      const errLower = errStr.toLowerCase()
      if (errLower.includes('already signed in')) {
        router.replace('/(tabs)')
        return
      }
      if (errLower.includes('identifier is invalid')) {
        setErrors({ general: 'Please enter a valid email address.' })
        return
      }
      logger.error('SignIn', err, { email: emailAddress })
      setErrors({ general: 'Invalid email or password. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OAuth sign in (Google only)
  const handleOAuthSignIn = useCallback(async () => {
    if (isOAuthLoading || !startSSOFlow) return

    setIsOAuthLoading('google')
    setErrors({})

    try {
      const redirectCandidates = getOAuthRedirectCandidates()
      let lastError: unknown = null

      for (const redirectUrl of redirectCandidates) {
        try {
          const ssoAttempt = await startSSOFlow({
            strategy: 'oauth_google',
            redirectUrl,
          })
          const createdSessionId =
            ssoAttempt.createdSessionId ??
            ssoAttempt.signIn?.createdSessionId ??
            ssoAttempt.signUp?.createdSessionId

          if (createdSessionId) {
            await ssoAttempt.setActive?.({ session: createdSessionId })
            setTimeout(() => router.replace('/(tabs)'), 500)
            return
          }

          const completionStatus = ssoAttempt.signIn?.status || ssoAttempt.signUp?.status
          if (completionStatus) {
            lastError = new Error(
              `Google authentication did not complete (status: ${completionStatus}).`
            )
            break
          }
        } catch (attemptError) {
          lastError = attemptError
        }
      }

      let errorMessage = getClerkErrorMessage(lastError, 'Failed to sign in with Google')
      if (errorMessage.includes('Missing external verification redirect URL for SSO flow')) {
        const primaryRedirect = redirectCandidates[0] || 'promptpal://sso-callback'
        errorMessage = `Google SSO redirect is not configured in Clerk. Add ${primaryRedirect} to Clerk redirect URLs.`
      }

      logger.error('OAuthSignIn', lastError, {
        provider: 'google',
        redirectCandidates,
      })
      setErrors({ general: errorMessage })
    } catch (err: unknown) {
      let errorMessage = getClerkErrorMessage(err, 'Failed to sign in with Google')
      if (errorMessage.includes('Missing external verification redirect URL for SSO flow')) {
        errorMessage = 'Google SSO redirect is not configured in Clerk for this app build.'
      }
      setErrors({ general: errorMessage })
    } finally {
      setIsOAuthLoading(null)
    }
  }, [startSSOFlow, isOAuthLoading])

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* Header */}
          <View className="items-center mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-primary text-4xl font-black tracking-tighter">Prompt</Text>
              <Text className="text-secondary text-4xl font-black tracking-tighter">Pal</Text>
            </View>
            <Text className="text-onSurfaceVariant text-center text-[10px] font-black uppercase tracking-[3px] leading-4">
              Enter your credentials to continue{'\n'}your engineering journey
            </Text>
          </View>

          {/* Sign In Form */}
          <View className="bg-surface border border-outline/20 rounded-[32px] p-5 shadow-2xl shadow-black/50 mb-4">
            <Text className="text-onSurface text-xl font-black mb-4 text-center tracking-tight">
              Welcome Back
            </Text>

            {errors.general && (
              <View className="bg-error/10 border border-error/30 rounded-2xl p-3 mb-4">
                <Text className="text-error text-[10px] text-center font-black uppercase tracking-widest">
                  {errors.general}
                </Text>
              </View>
            )}

            <View className="gap-3">
              <View>
                <Text className="text-onSurfaceVariant text-[10px] font-black uppercase mb-1.5 ml-1 tracking-[2px]">Email Address</Text>
                <View className={`bg-surfaceVariant/50 border ${errors.email ? 'border-error' : 'border-outline/30'} rounded-2xl px-4 py-3 flex-row items-center`}>
                  <Ionicons name="mail-outline" size={20} color={errors.email ? "#EF4444" : "#9CA3AF"} />
                  <TextInput
                    className="flex-1 ml-3 text-onSurface text-base font-bold"
                    value={emailAddress}
                    onChangeText={(text) => {
                      setEmailAddress(text)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </View>
                {errors.email && <Text className="text-error text-[10px] mt-1.5 ml-1 font-black uppercase tracking-widest">{errors.email}</Text>}
              </View>

              <View>
                <Text className="text-onSurfaceVariant text-[10px] font-black uppercase mb-1.5 ml-1 tracking-[2px]">Password</Text>
                <View className={`bg-surfaceVariant/50 border ${errors.password ? 'border-error' : 'border-outline/30'} rounded-2xl px-4 py-3 flex-row items-center`}>
                  <Ionicons name="key-outline" size={20} color={errors.password ? "#EF4444" : "#9CA3AF"} />
                  <TextInput
                    className="flex-1 ml-3 text-onSurface text-base font-bold"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="current-password"
                    textContentType="password"
                  />
                </View>
                {errors.password && <Text className="text-error text-[10px] mt-1.5 ml-1 font-black uppercase tracking-widest">{errors.password}</Text>}
              </View>
            </View>

            {/* OAuth - Google only */}
            <View className="mt-4">
              <View className="flex-row items-center mb-3">
                <View className="flex-1 h-px bg-outline/30" />
                <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mx-4">or continue with</Text>
                <View className="flex-1 h-px bg-outline/30" />
              </View>

              <TouchableOpacity
                onPress={() => handleOAuthSignIn()}
                disabled={!!isOAuthLoading}
                className={`bg-white border border-outline/30 h-12 rounded-2xl items-center justify-center flex-row shadow-lg ${isOAuthLoading ? 'opacity-70' : ''}`}
              >
                {isOAuthLoading ? (
                  <ActivityIndicator color="#4285F4" size="small" />
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    <Text className="text-gray-700 font-black text-xs uppercase tracking-widest ml-3">Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              className={`bg-primary h-14 rounded-full items-center justify-center mt-4 shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-black text-lg uppercase tracking-widest">Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="mt-4 self-center">
              <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest">Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center mt-4 mb-2">
            <Text className="text-onSurfaceVariant text-xs font-black uppercase tracking-widest">
              Don't have an account?
            </Text>
            <Link href="/(auth)/sign-up" className="ml-2">
              <Text className="text-primary text-xs font-black uppercase tracking-widest">
                Create Account
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
