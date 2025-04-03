import { ClerkProvider, SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-expo";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, router, useSegments } from "expo-router"; // Removed Stack, Added Slot, router, useSegments
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react"; // Removed useState as it's not used directly here
import "react-native-reanimated";
import { Platform, ActivityIndicator, View } from "react-native"; // Ensure Platform is imported
import "../global.css";
import { doc, getDoc } from "firebase/firestore";
// Removed duplicate import of Platform, ActivityIndicator, View
import { registerForPushNotificationsAsync } from "./config/notifications";
import * as Notifications from "expo-notifications";
import * as Haptics from 'expo-haptics'; // Import Haptics

SplashScreen.preventAutoHideAsync();

// Define the token cache using expo-secure-store for native, localStorage for web
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    console.log(`[TokenCache] Attempting getToken for key: ${key} on Platform: ${Platform.OS}`);
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          const value = localStorage.getItem(key);
          console.log(`[TokenCache] Web getToken ${key}: ${value ? 'Retrieved' : 'Not Found'}`);
          return value;
        }
        console.log(`[TokenCache] Web getToken ${key}: localStorage undefined`);
        return null;
      } catch (err) {
        console.error("[TokenCache] Web getToken error:", err);
        return null;
      }
    } else {
      try {
        const item = await SecureStore.getItemAsync(key);
        console.log(`[TokenCache] Native getToken ${key}: ${item ? 'Retrieved' : 'Not Found'}`);
        return item;
      } catch (error) {
        console.error("[TokenCache] Native getToken error:", error);
        return null; // Ensure null is returned on error
      }
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    console.log(`[TokenCache] Attempting saveToken for key: ${key} on Platform: ${Platform.OS}`);
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          console.log(`[TokenCache] Web saveToken ${key}: Stored successfully`);
        } else {
          console.log(`[TokenCache] Web saveToken ${key}: localStorage undefined`);
        }
      } catch (err) {
        console.error("[TokenCache] Web saveToken error:", err);
      }
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
        console.log(`[TokenCache] Native saveToken ${key}: Stored successfully`);
      } catch (error) {
        console.error("[TokenCache] Native saveToken error:", error);
        // Don't throw, just log the error. Clerk might handle this internally.
      }
    }
  },
  async deleteToken(key: string): Promise<void> {
    console.log(`[TokenCache] Attempting deleteToken for key: ${key} on Platform: ${Platform.OS}`);
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          console.log(`[TokenCache] Web deleteToken ${key}: Deleted successfully`);
        } else {
          console.log(`[TokenCache] Web deleteToken ${key}: localStorage undefined`);
        }
      } catch (err) {
        console.error("[TokenCache] Web deleteToken error:", err);
      }
    } else {
      try {
        await SecureStore.deleteItemAsync(key);
        console.log(`[TokenCache] Native deleteToken ${key}: Deleted successfully`);
      } catch (error) {
        console.error("[TokenCache] Native deleteToken error:", error);
        // Don't throw, just log the error.
      }
    }
  }
};

// Helper function to determine if a route is protected - MOVED INSIDE AuthStateHandler
// const isProtectedRoute = (segments: string[]) => {
//   const publicRoutes = ['index', 'signup'];
//   if (segments.length === 0) {
//     return false;
//   }
//   return !publicRoutes.includes(segments[0]);
// };

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <AuthStateHandler loaded={loaded} />
    </ClerkProvider>
  );
}

type AuthStateHandlerProps = {
  loaded: boolean;
};

function AuthStateHandler({ loaded }: AuthStateHandlerProps) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const segments = useSegments();

  // Helper function moved inside the component
  const isProtectedRoute = (segments: string[]) => {
    // Add 'complete-profile' to the list of public routes
    const publicRoutes = ['index', 'signup', 'complete-profile'];
    if (segments.length === 0) {
      return false;
    }
    return !publicRoutes.includes(segments[0]);
  };

  // Tempo Devtools Initialization (only on web)
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
      try {
        const { TempoDevtools } = require("tempo-devtools");
        TempoDevtools.init();
      } catch (e) {
        console.error("Failed to initialize Tempo Devtools:", e);
      }
    }
  }, []);

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Expo push token:", token);
      }
    });

    // Listener for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Foreground Notification received:", notification);
      // Trigger haptic feedback (vibration)
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success // Or .Warning / .Error depending on notification type
      );
    });

    // Listener for notification responses (user taps on notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification response received:", response);
      // Handle navigation or other actions based on the response
      // Example: const { data } = response.notification.request.content; router.push(data.url);
    });


    return () => {
      // Clean up listeners when the component unmounts
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
      // subscription.remove(); // Removed incorrect cleanup call
    };
  }, []);

  // Handle redirection based on auth state, role, and font loading
  useEffect(() => {
    // Directly access role from Clerk metadata
    const userRole = user?.publicMetadata?.role as string | undefined; // Get role from metadata
    const inProtectedRoute: boolean = isProtectedRoute(segments); // Explicitly type annotation
    // Adjust readyToRedirect logic if needed, isRoleLoading is removed
    const readyToRedirect = loaded && isLoaded;

    console.log("Checking redirect:", { readyToRedirect, loaded, isSignedIn, userId: user?.id, userRole, segments, inProtectedRoute });

    if (!readyToRedirect) {
      console.log("Still loading dependencies for redirection...");
      SplashScreen.hideAsync(); // Hide splash screen even if waiting for auth state
      return;
    }

    SplashScreen.hideAsync();

    if (!isSignedIn && inProtectedRoute) {
      console.log("Redirecting logged-out user to login...");
      router.replace("/");
    } else if (isSignedIn && (!segments[0] || segments[0] === "signup")) {
      // Check for role *before* redirecting from public route
      if (!userRole) {
        console.log("Redirecting logged-in user with MISSING role to /missing-role...");
        router.replace("/missing-role");
      } else {
        const targetRoute = userRole === "manager" ? "/manager" : "/engineer";
        console.log(`Redirecting logged-in user with role '${userRole}' from public route to ${targetRoute}...`);
        router.replace(targetRoute);
      }
    } else if (isSignedIn && inProtectedRoute) {
      // Also check for role when already on a protected route
      if (!userRole && segments[0] !== 'missing-role') { // Avoid redirect loop if already on missing-role
        console.log("Redirecting logged-in user with MISSING role from protected route to /missing-role...");
        router.replace("/missing-role");
      } else if (userRole) {
        const currentRouteBase = segments[0];
        const expectedDashboard = userRole === "manager" ? "manager" : "engineer";
        const sharedProtectedRoutes = ["settings", "notifications", "report-detail", "report-form"];

        // Only perform role mismatch check if the user has a role and isn't on the missing-role screen
        if (!sharedProtectedRoutes.includes(currentRouteBase) && currentRouteBase !== expectedDashboard && currentRouteBase !== 'missing-role') {
          console.warn(`Role/Route mismatch! User role '${userRole}' trying to access '/${currentRouteBase}'. Redirecting to /${expectedDashboard}...`);
          router.replace(`/${expectedDashboard}`);
        } else {
          console.log(`No redirect needed (logged in, role '${userRole || 'none'}' is on allowed route '/${segments.join("/")}' ).`);
        }
      } else {
        // User is logged in, has no role, but is already on the missing-role screen or another allowed screen (if any)
        console.log(`No redirect needed (logged in, no role, on route '/${segments.join("/")}').`);
      }
    } else {
      console.log("No redirect needed (logged out on public route or already on correct route).");
    }
    // Update dependencies: remove isRoleLoading, userRole state. Add user object directly.
  }, [loaded, isLoaded, isSignedIn, user, segments]);

  // Adjust loading condition: remove isRoleLoading and isSignedIn checks if handled by redirect logic
  if (!loaded || !isLoaded) {
    // Show a loading indicator or splash screen while Clerk is loading
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }


  // Consider simplifying this return structure if redirection handles everything
  return (
    <>
      {/* Slot renders the current matched route */}
      <Slot />
      <StatusBar style="auto" />
    </>
  );
}
