import { ClerkProvider, SignedIn, SignedOut, useAuth, useUser } from "@clerk/clerk-expo";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, router, useSegments } from "expo-router"; // Removed Stack, Added Slot, router, useSegments
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";
import { doc, getDoc } from "firebase/firestore";
import { Platform, ActivityIndicator, View } from "react-native";
import { registerForPushNotificationsAsync } from "./config/notifications";
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync();

// Helper function to determine if a route is protected
const isProtectedRoute = (segments: string[]) => {
  const publicRoutes = ['index', 'signup'];
  if (segments.length === 0) {
    return false;
  }
  return !publicRoutes.includes(segments[0]);
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <ClerkProvider publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
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

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle redirection based on auth state, role, and font loading
  useEffect(() => {
    // Directly access role from Clerk metadata
    const userRole = user?.publicMetadata?.role as string | undefined; // Get role from metadata
    const inProtectedRoute = isProtectedRoute(segments);
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
