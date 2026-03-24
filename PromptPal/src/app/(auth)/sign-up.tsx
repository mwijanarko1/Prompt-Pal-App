import * as React from 'react'
import { Text, View, KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth, useSignUp, useSSO, useSignInWithApple } from '@clerk/clerk-expo'
import { Link, Redirect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AuthField } from '@/components/auth/AuthField'
import { GoogleIcon } from '@/components/GoogleIcon'
import * as WebBrowser from 'expo-web-browser'
import { logger } from '@/lib/logger'
import { getClerkErrorMessage, getOAuthRedirectCandidates } from '@/lib/oauthRedirect'

// Browser warming hook for better OAuth UX
const useWarmUpBrowser = () => {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync().catch(() => undefined)
    return () => {
      void WebBrowser.coolDownAsync().catch(() => undefined)
    }
  }, [])
}

WebBrowser.maybeCompleteAuthSession()

export default function SignUpScreen() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const { isLoaded, signUp, setActive } = useSignUp()
  const { startSSOFlow } = useSSO()
  const { startAppleAuthenticationFlow } = useSignInWithApple()
  const router = useRouter()

  useWarmUpBrowser()

  // If already signed in (e.g. from race with tabs redirect), go straight to app
  if (isAuthLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    code?: string;
    general?: string
  }>({})

  const openVerificationStep = React.useCallback(() => {
    setErrors({})
    setPendingVerification(true)
  }, [])

  // Validate sign-up form
  const validateSignUpForm = () => {
    const newErrors: { firstName?: string; lastName?: string; email?: string; password?: string } = {}

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

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
    const newErrors: { code?: string } = {}

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
      const signUpAttempt = await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        emailAddress,
        password,
      })

      if (signUpAttempt.status === 'complete' && signUpAttempt.createdSessionId) {
        await setActive({ session: signUpAttempt.createdSessionId })
        setTimeout(() => router.replace('/(tabs)'), 500)
        return
      }

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      openVerificationStep()
    } catch (err) {
      const errStr = err && typeof err === 'object'
        ? JSON.stringify(err)
        : String(err)
      const errLower = errStr.toLowerCase()

      if (errLower.includes('already signed in')) {
        if (isAuthLoaded && isSignedIn) {
          router.replace('/(tabs)')
          return
        }

        try {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
          openVerificationStep()
          return
        } catch {
          openVerificationStep()
          return
        }
      }

      if (
        errLower.includes('email verification') ||
        errLower.includes('email address is invalid') ||
        errLower.includes('verification') ||
        errLower.includes('sign_up')
      ) {
        openVerificationStep()
        return
      }

      const errorMessage = getClerkErrorMessage(err, 'Failed to create account')
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
        // Auth layout Redirect will navigate when isSignedIn propagates.
        // Defer navigation to avoid race where layout still sees isSignedIn=false.
        setTimeout(() => router.replace('/(tabs)'), 500)
      } else {
        setErrors({ general: 'Verification failed. Please try again.' })
      }
    } catch (err) {
      const errorMessage = getClerkErrorMessage(err, 'Verification failed. Please try again.')
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OAuth sign up with Google
  const handleOAuthSignUp = React.useCallback(async () => {
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

      let errorMessage = getClerkErrorMessage(lastError, 'Failed to sign up with Google')
      if (errorMessage.includes('Missing external verification redirect URL for SSO flow')) {
        const primaryRedirect = redirectCandidates[0] || 'promptpal://sso-callback'
        errorMessage = `Google SSO redirect is not configured in Clerk. Add ${primaryRedirect} to Clerk redirect URLs.`
      }

      logger.error('OAuthSignUp', lastError, {
        provider: 'google',
        redirectCandidates,
      })

      setErrors({ general: errorMessage })
    } catch (err: unknown) {
      let errorMessage = getClerkErrorMessage(err, 'Failed to sign up with Google')
      if (errorMessage.includes('Missing external verification redirect URL for SSO flow')) {
        errorMessage = 'Google SSO redirect is not configured in Clerk for this app build.'
      }
      setErrors({ general: errorMessage })
    } finally {
      setIsOAuthLoading(null)
    }
  }, [startSSOFlow, isOAuthLoading])

  const handleAppleSignUp = React.useCallback(async () => {
    if (isOAuthLoading) return

    setIsOAuthLoading('apple')
    setErrors({})

    try {
      if (Platform.OS === 'ios') {
        const appleAttempt = await startAppleAuthenticationFlow()

        if (appleAttempt.createdSessionId && appleAttempt.setActive) {
          await appleAttempt.setActive({ session: appleAttempt.createdSessionId })
          setTimeout(() => router.replace('/(tabs)'), 500)
        }

        return
      }

      const redirectCandidates = getOAuthRedirectCandidates()
      let lastError: unknown = null

      for (const redirectUrl of redirectCandidates) {
        try {
          const ssoAttempt = await startSSOFlow({
            strategy: 'oauth_apple',
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
              `Apple authentication did not complete (status: ${completionStatus}).`
            )
            break
          }
        } catch (attemptError) {
          lastError = attemptError
        }
      }

      let errorMessage = getClerkErrorMessage(lastError, 'Failed to sign up with Apple')
      if (errorMessage.includes('Missing external verification redirect URL for SSO flow')) {
        const primaryRedirect = redirectCandidates[0] || 'promptpal://sso-callback'
        errorMessage = `Apple SSO redirect is not configured in Clerk. Add ${primaryRedirect} to Clerk redirect URLs.`
      }

      logger.error('AppleSignUp', lastError, {
        provider: 'apple',
        redirectCandidates,
      })

      setErrors({ general: errorMessage })
    } catch (err: unknown) {
      const errorMessage = getClerkErrorMessage(err, 'Failed to sign up with Apple')
      setErrors({ general: errorMessage })
    } finally {
      setIsOAuthLoading(null)
    }
  }, [isOAuthLoading, router, startAppleAuthenticationFlow, startSSOFlow])

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }}
            showsVerticalScrollIndicator={false}
            className="px-6"
          >
            {/* Header */}
            <View className="mb-8 items-center">
              <View className="mb-5 h-16 w-16 items-center justify-center rounded-[24px] border border-info/20 bg-info/10 shadow-lg shadow-info/15">
                <Ionicons name="mail-unread" size={32} color="#4151FF" />
              </View>
              <Text className="mb-2 text-3xl font-black tracking-tight text-onSurface">
                Verify Email
              </Text>
              <Text className="px-8 text-center text-sm leading-5 text-onSurfaceVariant">
                We've sent a 6-digit code to{'\n'}<Text className="text-onSurface font-black tracking-normal">{emailAddress}</Text>
              </Text>
            </View>

            {/* Verification Form */}
            <View className="mb-8 w-full self-center rounded-[28px] border border-outline/15 bg-surface px-6 py-7 shadow-2xl shadow-black/30">
              {errors.general && (
                <View className="mb-5 rounded-[18px] border border-error/25 bg-error/8 px-4 py-3">
                  <Text className="text-center text-[11px] font-semibold leading-4 text-error">
                    {errors.general}
                  </Text>
                </View>
              )}

              <View className="mb-6">
                <Text className="mb-2 text-center text-[11px] font-bold uppercase tracking-[1.8px] text-onSurfaceVariant">Enter 6-digit code</Text>
                <View className={`h-20 items-center justify-center rounded-[22px] border bg-surfaceVariant/45 px-4 ${errors.code ? 'border-error' : 'border-outline/25'}`}>
                  <TextInput
                    className="w-full text-center text-[34px] font-black tracking-[8px] text-onSurface"
                    value={code}
                    onChangeText={(text) => {
                      setCode(text.replace(/[^0-9]/g, '').slice(0, 6))
                      if (errors.code) setErrors({ ...errors, code: undefined })
                    }}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    autoFocus
                  />
                </View>
                {errors.code ? <Text className="mt-2 text-center text-[11px] font-semibold text-error">{errors.code}</Text> : null}
              </View>

              <TouchableOpacity
                onPress={onVerifyPress}
                disabled={isLoading}
                className={`h-14 items-center justify-center rounded-[18px] bg-primary shadow-lg shadow-primary/20 ${isLoading ? 'opacity-70' : ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-black uppercase tracking-[2px] text-white">Verify & Join</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPendingVerification(false)}
                className="mt-5 items-center py-2"
              >
                <Text className="text-[11px] font-semibold tracking-[0.2px] text-onSurfaceVariant">Back to sign up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 28 }}
          showsVerticalScrollIndicator={false}
          className="px-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-6 items-center">
            <View className="mb-2 flex-row items-center">
              <Text className="text-primary text-4xl font-black tracking-tighter">Prompt</Text>
              <Text className="text-secondary text-4xl font-black tracking-tighter">Pal</Text>
            </View>
            <Text className="px-8 text-center text-[11px] font-semibold uppercase tracking-[2px] leading-5 text-onSurfaceVariant">
              Create an account to start your{'\n'}mastery journey
            </Text>
          </View>

          {/* Sign Up Form */}
          <View className="mb-4 w-full self-center rounded-[28px] border border-outline/15 bg-surface px-6 py-7 shadow-2xl shadow-black/30">
            <Text className="mb-2 text-center text-[28px] font-black tracking-tight text-onSurface">
              Sign Up
            </Text>
            <Text className="mb-6 text-center text-sm leading-5 text-onSurfaceVariant">
              Build your profile and unlock the onboarding path.
            </Text>

            {errors.general && (
              <View className="mb-5 rounded-[18px] border border-error/25 bg-error/8 px-4 py-3">
                <Text className="text-center text-[11px] font-semibold leading-4 text-error">
                  {errors.general}
                </Text>
              </View>
            )}

            <View className="gap-4">
              <AuthField
                label="First name"
                icon="person-outline"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text)
                  if (errors.firstName) setErrors({ ...errors, firstName: undefined })
                }}
                error={errors.firstName}
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="given-name"
                textContentType="givenName"
                placeholder="First"
              />

              <AuthField
                label="Last name"
                icon="person-outline"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text)
                  if (errors.lastName) setErrors({ ...errors, lastName: undefined })
                }}
                error={errors.lastName}
                autoCapitalize="words"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="family-name"
                textContentType="familyName"
                placeholder="Last"
              />

              <AuthField
                label="Email address"
                icon="mail-outline"
                value={emailAddress}
                onChangeText={(text) => {
                  setEmailAddress(text)
                  if (errors.email) setErrors({ ...errors, email: undefined })
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="email"
                textContentType="emailAddress"
                placeholder="name@example.com"
              />

              <AuthField
                label="Password"
                icon="key-outline"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) setErrors({ ...errors, password: undefined })
                }}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="Create a password"
              />
            </View>

            <View className="mt-5 rounded-[18px] bg-surfaceVariant/28 px-4 py-3">
              <Text className="text-[11px] leading-4 text-onSurfaceVariant">
                • 8+ characters, uppercase, lowercase, and a number.
              </Text>
            </View>

            {/* Social auth */}
            <View className="mt-6">
              <View className="mb-4 flex-row items-center">
                <View className="flex-1 h-px bg-outline/30" />
                <Text className="mx-4 text-[10px] font-semibold uppercase tracking-[1.8px] text-onSurfaceVariant">or continue with</Text>
                <View className="flex-1 h-px bg-outline/30" />
              </View>

              <TouchableOpacity
                onPress={() => handleOAuthSignUp()}
                disabled={!!isOAuthLoading}
                className={`h-14 flex-row items-center justify-center rounded-[18px] border border-outline/25 bg-white shadow-lg ${isOAuthLoading ? 'opacity-70' : ''}`}
              >
                {isOAuthLoading === 'google' ? (
                  <ActivityIndicator color="#4285F4" size="small" />
                ) : (
                  <>
                    <GoogleIcon size={20} />
                    <Text className="ml-3 text-xs font-bold uppercase tracking-[1.8px] text-gray-700">Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={handleAppleSignUp}
                  disabled={!!isOAuthLoading}
                  className={`mt-3 h-14 flex-row items-center justify-center rounded-[18px] border border-white/10 bg-black shadow-lg ${isOAuthLoading ? 'opacity-70' : ''}`}
                >
                  {isOAuthLoading === 'apple' ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                      <Text className="ml-3 text-xs font-bold uppercase tracking-[1.8px] text-white">Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={isLoading}
              className={`mt-6 h-14 items-center justify-center rounded-[18px] bg-secondary shadow-lg shadow-secondary/20 ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-black uppercase tracking-[2px] text-white">Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View className="mb-2 mt-4 flex-row items-center justify-center">
            <Text className="text-sm font-medium text-onSurfaceVariant">
              Already have an account?
            </Text>
            <Link href="/(auth)/sign-in" className="ml-2">
              <Text className="text-sm font-bold text-secondary">
                Sign In
              </Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
