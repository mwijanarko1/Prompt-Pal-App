import { Redirect } from 'expo-router';

/**
 * Redirect route that explicitly navigates to the root level select screen.
 * This helps bypass Expo Router's route group priority when navigating from (home) route group.
 * 
 * When navigating from (home)/game/[id].tsx, using router.replace('/level-select') will
 * navigate to this route (outside the route group), which then redirects to the root '/',
 * ensuring we reach src/app/index.tsx (level select) instead of src/app/(home)/index.tsx (dashboard).
 */
export default function LevelSelectRedirect() {
  // Redirect to root level select (index.tsx)
  // This ensures we go to the root level select, not the dashboard
  return <Redirect href="/" />;
}
