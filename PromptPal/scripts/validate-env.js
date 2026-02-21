const required = ['EXPO_PUBLIC_CONVEX_URL', 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'];
const missing = required.filter(name => !process.env[name]);
if (missing.length > 0) {
  console.error('Missing required env vars:', missing.join(', '));
  console.error('For EAS: eas secret:create --scope project --name <name> --value <value>');
  process.exit(1);
}
