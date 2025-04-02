import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import { auth, db } from '../../config/firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as AuthSession from 'expo-auth-session';
import { ResponseType, makeRedirectUri } from 'expo-auth-session';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Function to register for push notifications
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Failed to get push token for push notification!');
      return null;
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      Alert.alert('Configuration Error', 'Missing EAS project ID in app config. Cannot get push token.');
      return null;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } catch (e) {
      console.error("Error getting Expo push token:", e);
      Alert.alert('Error', 'Could not get push token.');
      return null;
    }
  } else {
    Alert.alert('Must use physical device for Push Notifications');
    return null;
  }

  return token;
}

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const redirectUri = makeRedirectUri();
console.log('Redirect URI:', redirectUri);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSuccessfulLogin = async (user: any) => {
    console.log('Login successful, handling user:', user.uid);

    try {
      const token = await registerForPushNotificationsAsync();
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        expoPushToken: token || null,
        updatedAt: new Date(),
        email: user.email,
        displayName: user.displayName || '',
      }, { merge: true });
    } catch (tokenError) {
      console.error('Error registering/saving push token or user info:', tokenError);
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Role check and navigation are now handled by _layout.tsx based on auth state change.
      // We just log the success here. The _layout component will fetch the role
      // and navigate accordingly once the auth state is confirmed.
      if (userDocSnap.exists() && userDocSnap.data()?.role) {
        const role = userDocSnap.data().role;
        console.log(`Login successful for user ${user.uid} with role: ${role}. _layout will handle navigation.`);
      } else {
        console.log(`Login successful for user ${user.uid}. New user or no role found. _layout will navigate to role selection.`);
      }
    } catch (roleError) {
      // Log error, but don't set component error state here as _layout might handle fallback
      console.error('Error checking user role during login:', roleError);
      // setError('Could not verify user role. Please try again.'); // Let _layout handle potential errors/redirects
    }
    // No navigation here - _layout.tsx handles it based on auth state change
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential.user);
    } catch (err: any) {
      console.error("Login Error:", err);
      let errorMessage = "Login failed. Please check your credentials.";
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        errorMessage = "Invalid email or password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many login attempts. Please try again later.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '98325339290-8n5b0b62g0n3n82g9r1qquifpb8ldn5a.apps.googleusercontent.com',
      responseType: ResponseType.IdToken,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: makeRedirectUri(),
      usePKCE: false, // 👈 
      extraParams: {
        nonce: 'mynonce', // ✅ this is the correct way
      }
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        const googleCredential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, googleCredential)
          .then((userCredential) => {
            // Login successful. The onAuthStateChanged listener in _layout.tsx
            // will detect the new user state and handle role fetching and navigation.
            // No further action needed here regarding navigation or immediate user data updates.
            console.log('Firebase Sign-In with Google credential successful. _layout will handle next steps.');
            // handleSuccessfulLogin(userCredential.user); // Removed this call
          })
          .catch((error) => {
            console.error('Error signing in with Google credential:', error);
            setError('Google sign-in failed. Please try again.');
          });
      } else {
        setError('No ID token returned by Google.');
      }
    }
  }, [response]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }} className="flex-1 justify-center p-6">
            <View className="items-center mb-8">
              <Image
                source={{ uri: "https://via.placeholder.com/100" }}
                style={{ width: 100, height: 100, marginBottom: 16 }}
              />
              <Text className="text-2xl font-bold text-blue-800">
                Construction Material Manager
              </Text>
              <Text className="text-gray-500 mt-2">
                Login to access your dashboard
              </Text>
            </View>

            {error ? (
              <Text className="text-red-500 mb-4 text-center">{error}</Text>
            ) : null}

            <View className="mb-4">
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 mb-4">
                <Mail size={20} color="#4B5563" />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View className="flex-row items-center border border-gray-300 rounded-lg p-3">
                <Lock size={20} color="#4B5563" />
                <TextInput
                  className="flex-1 ml-2 text-base"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#4B5563" />
                  ) : (
                    <Eye size={20} color="#4B5563" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`p-4 rounded-lg ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-center font-bold text-lg">
                  Login
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-600 p-4 rounded-lg mt-4"
              onPress={() => {
                setError('');
                promptAsync();
              }}
              disabled={!request}
            >
              <Text className="text-white text-center font-bold text-lg">
                Sign in with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-6"
              onPress={() => {
                console.log("Navigating to Sign Up");
                router.push('/signup');
              }}
            >
              <Text className="text-blue-600 text-center text-base">
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
