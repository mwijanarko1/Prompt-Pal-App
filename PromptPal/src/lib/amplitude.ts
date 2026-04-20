import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { logger } from "@/lib/logger";

const AMPLITUDE_API_URL = "https://api2.amplitude.com/2/httpapi";
const AMPLITUDE_DEVICE_ID_KEY = "amplitude_device_id";

type AmplitudeEventProperties = Record<
	string,
	string | number | boolean | null | undefined
>;

let amplitudeDeviceIdPromise: Promise<string | null> | null = null;

function getAmplitudeApiKey() {
	return process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY?.trim() || "";
}

function isAmplitudeConfigured() {
	return getAmplitudeApiKey().length > 0;
}

async function createDeviceId() {
	try {
		return await Crypto.randomUUID();
	} catch {
		return `amp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
	}
}

async function getDeviceId() {
	if (!isAmplitudeConfigured()) {
		return null;
	}

	if (!amplitudeDeviceIdPromise) {
		amplitudeDeviceIdPromise = (async () => {
			const existingDeviceId = await SecureStore.getItemAsync(
				AMPLITUDE_DEVICE_ID_KEY,
			);
			if (existingDeviceId) {
				return existingDeviceId;
			}

			const generatedDeviceId = await createDeviceId();
			await SecureStore.setItemAsync(
				AMPLITUDE_DEVICE_ID_KEY,
				generatedDeviceId,
			);
			return generatedDeviceId;
		})().catch((error) => {
			logger.warn(
				"Amplitude",
				"Failed to initialize a persisted device ID.",
				error instanceof Error ? { message: error.message } : undefined,
			);
			amplitudeDeviceIdPromise = null;
			return null;
		});
	}

	return amplitudeDeviceIdPromise;
}

export async function initializeAmplitude() {
	if (!isAmplitudeConfigured()) {
		return;
	}

	await getDeviceId();
}

export async function trackAmplitudeEvent(
	eventType: string,
	eventProperties?: AmplitudeEventProperties,
	options?: { userId?: string | null },
) {
	if (!isAmplitudeConfigured()) {
		return;
	}

	try {
		const deviceId = await getDeviceId();

		const response = await fetch(AMPLITUDE_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				api_key: getAmplitudeApiKey(),
				events: [
					{
						event_type: eventType,
						user_id: options?.userId || undefined,
						device_id: deviceId || undefined,
						platform: Platform.OS,
						time: Date.now(),
						event_properties: eventProperties,
					},
				],
			}),
		});

		if (!response.ok) {
			const responseText = await response.text().catch(() => "");
			logger.warn("Amplitude", "Failed to send event.", {
				eventType,
				status: response.status,
				responseText,
			});
		}
	} catch (error) {
		logger.warn(
			"Amplitude",
			"Unexpected error while sending event.",
			error instanceof Error
				? { eventType, message: error.message }
				: { eventType },
		);
	}
}
