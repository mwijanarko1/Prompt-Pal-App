/**
 * Environment variable validation and management
 */

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_AI_PROXY_URL',
] as const;

/**
 * Validates that all required environment variables are set
 * In development, logs warnings instead of throwing errors
 * @throws {Error} If any required environment variable is missing (production only)
 */
export function validateEnvironment(): void {
  const missingVars: string[] = [];

  console.log('[Environment] Validating environment variables...');
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    console.log(`[Environment] ${varName}: ${value ? 'SET' : 'MISSING'} (${value || 'undefined'})`);
    if (!value) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.';
    
    // In development, log warning instead of throwing to allow app to run
    if (__DEV__) {
      console.warn('[Environment] ⚠️', errorMessage);
      console.warn('[Environment] App will continue in development mode, but some features may not work.');
    } else {
      // In production, throw error
      throw new Error(errorMessage);
    }
  } else {
    console.log('[Environment] ✅ All required variables are set');
  }
}

/**
 * Gets a required environment variable with validation
 * @param name - Environment variable name
 * @returns The environment variable value
 * @throws {Error} If the variable is not set
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable "${name}" is not set`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 * @param name - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns The environment variable value or default
 */
export function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}