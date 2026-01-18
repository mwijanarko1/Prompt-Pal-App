import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SignIn } from '@clerk/clerk-expo';

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <SignIn
        routing="path"
        path="/auth/sign-in"
        redirectUrl="/"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});