import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Must be exported or Fast Refresh won't update the context
export function App() {
  console.log("DEBUG: App component rendering");

  // @ts-expect-error: require.context is a metro-specific feature
  const ctx = require.context("./src/app");
  console.log("DEBUG: require.context result:", ctx);

  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
