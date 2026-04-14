import {
	useAuth,
	useSignIn,
	useSSO,
	useSignInWithApple,
} from "@clerk/clerk-expo";
import { Link, Redirect, useRouter } from "expo-router";
import {
	Text,
	View,
	KeyboardAvoidingView,
	TouchableOpacity,
	ActivityIndicator,
	Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { GoogleIcon } from "@/components/GoogleIcon";
import { AuthField } from "@/components/auth/AuthField";
import * as WebBrowser from "expo-web-browser";
import { logger } from "@/lib/logger";
import {
	getClerkErrorMessage,
	getOAuthRedirectCandidates,
} from "@/lib/oauthRedirect";

// Browser warming hook for better OAuth UX
const useWarmUpBrowser = () => {
	useEffect(() => {
		void WebBrowser.warmUpAsync().catch(() => undefined);
		return () => {
			void WebBrowser.coolDownAsync().catch(() => undefined);
		};
	}, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
	const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
	const { signIn, setActive, isLoaded } = useSignIn();
	const { startSSOFlow } = useSSO();
	const { startAppleAuthenticationFlow } = useSignInWithApple();
	const router = useRouter();

	useWarmUpBrowser();

	// If already signed in (e.g. from race with tabs redirect), go straight to app
	if (isAuthLoaded && isSignedIn) {
		return <Redirect href="/(tabs)" />;
	}

	const [emailAddress, setEmailAddress] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		general?: string;
	}>({});

	// Validate form inputs
	const validateForm = () => {
		const newErrors: { email?: string; password?: string } = {};

		if (!emailAddress.trim()) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
			newErrors.email = "Please enter a valid email address";
		}

		if (!password.trim()) {
			newErrors.password = "Password is required";
		} else if (password.length < 8) {
			newErrors.password = "Password must be at least 8 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const onSignInPress = async () => {
		if (!isLoaded || isLoading) return;

		if (!validateForm()) return;

		setIsLoading(true);
		setErrors({});

		try {
			const identifier = emailAddress.trim();
			const signInAttempt = await signIn.create({
				identifier,
				password,
			});

			// If sign-in process is complete, set the created session as active
			// and redirect the user
			if (signInAttempt.status === "complete") {
				await setActive({ session: signInAttempt.createdSessionId });
				setTimeout(() => router.replace("/(tabs)"), 500);
			} else {
				// If the status isn't complete, check why. User might need to
				// complete further steps.
				setErrors({ general: "Sign in failed. Please try again." });
			}
		} catch (err) {
			const errStr =
				err && typeof err === "object" ? JSON.stringify(err) : String(err);
			const errLower = errStr.toLowerCase();
			if (errLower.includes("already signed in")) {
				router.replace("/(tabs)");
				return;
			}
			if (errLower.includes("identifier is invalid")) {
				setErrors({ general: "Please enter a valid email address." });
				return;
			}
			logger.error("SignIn", err, { email: emailAddress });
			setErrors({ general: "Invalid email or password. Please try again." });
		} finally {
			setIsLoading(false);
		}
	};

	const handleOAuthSignIn = useCallback(async () => {
		if (isOAuthLoading || !startSSOFlow) return;

		setIsOAuthLoading("google");
		setErrors({});

		try {
			const redirectCandidates = getOAuthRedirectCandidates();
			let lastError: unknown = null;

			for (const redirectUrl of redirectCandidates) {
				try {
					const ssoAttempt = await startSSOFlow({
						strategy: "oauth_google",
						redirectUrl,
					});
					const createdSessionId =
						ssoAttempt.createdSessionId ??
						ssoAttempt.signIn?.createdSessionId ??
						ssoAttempt.signUp?.createdSessionId;

					if (createdSessionId) {
						await ssoAttempt.setActive?.({ session: createdSessionId });
						setTimeout(() => router.replace("/(tabs)"), 500);
						return;
					}

					const completionStatus =
						ssoAttempt.signIn?.status || ssoAttempt.signUp?.status;
					if (completionStatus) {
						lastError = new Error(
							`Google authentication did not complete (status: ${completionStatus}).`,
						);
						break;
					}
				} catch (attemptError) {
					lastError = attemptError;
				}
			}

			let errorMessage = getClerkErrorMessage(
				lastError,
				"Failed to sign in with Google",
			);
			if (
				errorMessage.includes(
					"Missing external verification redirect URL for SSO flow",
				)
			) {
				const primaryRedirect =
					redirectCandidates[0] || "promptpal://sso-callback";
				errorMessage = `Google SSO redirect is not configured in Clerk. Add ${primaryRedirect} to Clerk redirect URLs.`;
			}

			logger.error("OAuthSignIn", lastError, {
				provider: "google",
				redirectCandidates,
			});
			setErrors({ general: errorMessage });
		} catch (err: unknown) {
			let errorMessage = getClerkErrorMessage(
				err,
				"Failed to sign in with Google",
			);
			if (
				errorMessage.includes(
					"Missing external verification redirect URL for SSO flow",
				)
			) {
				errorMessage =
					"Google SSO redirect is not configured in Clerk for this app build.";
			}
			setErrors({ general: errorMessage });
		} finally {
			setIsOAuthLoading(null);
		}
	}, [startSSOFlow, isOAuthLoading, router]);

	const handleAppleSignIn = useCallback(async () => {
		if (isOAuthLoading) return;

		setIsOAuthLoading("apple");
		setErrors({});

		try {
			if (Platform.OS === "ios") {
				const appleAttempt = await startAppleAuthenticationFlow();

				if (appleAttempt.createdSessionId && appleAttempt.setActive) {
					await appleAttempt.setActive({
						session: appleAttempt.createdSessionId,
					});
					setTimeout(() => router.replace("/(tabs)"), 500);
				}

				return;
			}

			const redirectCandidates = getOAuthRedirectCandidates();
			let lastError: unknown = null;

			for (const redirectUrl of redirectCandidates) {
				try {
					const ssoAttempt = await startSSOFlow({
						strategy: "oauth_apple",
						redirectUrl,
					});
					const createdSessionId =
						ssoAttempt.createdSessionId ??
						ssoAttempt.signIn?.createdSessionId ??
						ssoAttempt.signUp?.createdSessionId;

					if (createdSessionId) {
						await ssoAttempt.setActive?.({ session: createdSessionId });
						setTimeout(() => router.replace("/(tabs)"), 500);
						return;
					}

					const completionStatus =
						ssoAttempt.signIn?.status || ssoAttempt.signUp?.status;
					if (completionStatus) {
						lastError = new Error(
							`Apple authentication did not complete (status: ${completionStatus}).`,
						);
						break;
					}
				} catch (attemptError) {
					lastError = attemptError;
				}
			}

			let errorMessage = getClerkErrorMessage(
				lastError,
				"Failed to sign in with Apple",
			);
			if (
				errorMessage.includes(
					"Missing external verification redirect URL for SSO flow",
				)
			) {
				const primaryRedirect =
					redirectCandidates[0] || "promptpal://sso-callback";
				errorMessage = `Apple SSO redirect is not configured in Clerk. Add ${primaryRedirect} to Clerk redirect URLs.`;
			}

			logger.error("AppleSignIn", lastError, {
				provider: "apple",
				redirectCandidates,
			});
			setErrors({ general: errorMessage });
		} catch (err: unknown) {
			const errorMessage = getClerkErrorMessage(
				err,
				"Failed to sign in with Apple",
			);
			setErrors({ general: errorMessage });
		} finally {
			setIsOAuthLoading(null);
		}
	}, [isOAuthLoading, router, startAppleAuthenticationFlow, startSSOFlow]);

	return (
		<SafeAreaView className="flex-1 bg-background">
			<KeyboardAvoidingView behavior="padding" className="flex-1">
				<View className="flex-1 justify-center px-6">
					{/* Header */}
					<View className="mb-6 items-center">
						<View className="mb-2 flex-row items-center">
							<Text className="text-primary text-4xl font-black tracking-tighter">
								Prompt
							</Text>
							<Text className="text-secondary text-4xl font-black tracking-tighter">
								Pal
							</Text>
						</View>
						<Text className="px-8 text-center text-[11px] font-semibold uppercase tracking-[2px] leading-5 text-onSurfaceVariant">
							Enter your credentials to continue{"\n"}your engineering journey
						</Text>
					</View>

					{/* Sign In Form */}
					<View className="mb-4 w-full self-center rounded-[28px] border border-outline/15 bg-surface px-6 py-7 shadow-2xl shadow-black/30">
						<Text className="mb-2 text-center text-[28px] font-black tracking-tight text-onSurface">
							Welcome Back
						</Text>
						<Text className="mb-6 text-center text-sm leading-5 text-onSurfaceVariant">
							Sign in to pick up your next prompt challenge.
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
								label="Email address"
								icon="mail-outline"
								value={emailAddress}
								onChangeText={(text) => {
									setEmailAddress(text);
									if (errors.email) setErrors({ ...errors, email: undefined });
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
									setPassword(text);
									if (errors.password)
										setErrors({ ...errors, password: undefined });
								}}
								error={errors.password}
								secureTextEntry
								autoCapitalize="none"
								autoCorrect={false}
								spellCheck={false}
								autoComplete="current-password"
								textContentType="password"
								placeholder="Enter your password"
							/>
						</View>

						{/* Social auth */}
						<View className="mt-6">
							<View className="mb-4 flex-row items-center">
								<View className="flex-1 h-px bg-outline/30" />
								<Text className="mx-4 text-[10px] font-semibold uppercase tracking-[1.8px] text-onSurfaceVariant">
									or continue with
								</Text>
								<View className="flex-1 h-px bg-outline/30" />
							</View>

							<TouchableOpacity
								onPress={() => handleOAuthSignIn()}
								disabled={!!isOAuthLoading}
								className={`h-14 flex-row items-center justify-center rounded-[18px] border border-outline/25 bg-white shadow-lg ${isOAuthLoading ? "opacity-70" : ""}`}
							>
								{isOAuthLoading === "google" ? (
									<ActivityIndicator color="#4285F4" size="small" />
								) : (
									<>
										<GoogleIcon size={20} />
										<Text className="ml-3 text-xs font-bold uppercase tracking-[1.8px] text-gray-700">
											Google
										</Text>
									</>
								)}
							</TouchableOpacity>

							{Platform.OS === "ios" && (
								<TouchableOpacity
									onPress={handleAppleSignIn}
									disabled={!!isOAuthLoading}
									className={`mt-3 h-14 flex-row items-center justify-center rounded-[18px] border border-white/10 bg-black shadow-lg ${isOAuthLoading ? "opacity-70" : ""}`}
								>
									{isOAuthLoading === "apple" ? (
										<ActivityIndicator color="#FFFFFF" size="small" />
									) : (
										<>
											<Ionicons name="logo-apple" size={20} color="#FFFFFF" />
											<Text className="ml-3 text-xs font-bold uppercase tracking-[1.8px] text-white">
												Apple
											</Text>
										</>
									)}
								</TouchableOpacity>
							)}
						</View>

						<TouchableOpacity
							onPress={onSignInPress}
							disabled={isLoading}
							className={`mt-6 h-14 items-center justify-center rounded-[18px] bg-primary shadow-lg shadow-primary/20 ${isLoading ? "opacity-70" : ""}`}
						>
							{isLoading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text className="text-base font-black uppercase tracking-[2px] text-white">
									Sign In
								</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity className="mt-4 self-center">
							<Text className="text-[11px] font-semibold tracking-[0.2px] text-onSurfaceVariant">
								Forgot password?
							</Text>
						</TouchableOpacity>
					</View>

					{/* Sign Up Link */}
					<View className="mb-2 mt-4 flex-row items-center justify-center">
						<Text className="text-sm font-medium text-onSurfaceVariant">
							Don't have an account?
						</Text>
						<Link href="/(auth)/sign-up" className="ml-2">
							<Text className="text-sm font-bold text-primary">
								Create Account
							</Text>
						</Link>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
