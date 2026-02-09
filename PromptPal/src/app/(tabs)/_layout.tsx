import { Redirect } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@clerk/clerk-expo';

export default function TabLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect unauthenticated users to sign-in
  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index" title="Home">
        <Icon sf="house.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library" title="Library">
        <Icon sf="book.fill" />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile" title="Profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
