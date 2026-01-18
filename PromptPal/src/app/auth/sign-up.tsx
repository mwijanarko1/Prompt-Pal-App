import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SignUp } from '@clerk/clerk-expo';

export default function SignUpScreen() {
  return (
    <View style={styles.container}>
      <SignUp
        routing="path"
        path="/auth/sign-up"
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