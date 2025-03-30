import React from 'react';
import SignupScreen from './components/auth/SignupScreen';
import { Stack } from 'expo-router'; // Import Stack for header options if needed

const SignupPageRoute = () => {
  // You can use Stack.Screen here to configure the header if desired
  // e.g., <Stack.Screen options={{ title: 'Create Account' }} />
  // If no header customization is needed, you can omit the Stack import and usage.
  return <SignupScreen />; // Remove the navigation prop as it's no longer needed
  // Note: Expo Router provides navigation context automatically.
  // A better approach might be to refactor SignupScreen to use `useRouter` hook from expo-router if needed.
};

export default SignupPageRoute;
