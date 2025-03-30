import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot, router, useSegments } from "expo-router"; // Removed Stack, Added Slot, router, useSegments
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useCallback } from "react"; // Added useState, useCallback
import "react-native-reanimated";
import "../global.css";
import { auth, db } from "./config/firebase"; // Corrected import path, added db
import { onAuthStateChanged, User } from "firebase/auth"; // Import auth functions
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Platform, ActivityIndicator, View } from "react-native"; // Added ActivityIndicator, View
import { registerForPushNotificationsAsync } from "./config/notifications";
import * as Notifications from "expo-notifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Helper function to determine if a route is protected
const isProtectedRoute = (segments: string[]) => {
  // Define routes that should be accessible even when logged out
  const publicRoutes = ['index', 'signup']; // Add 'signup' to the list of public routes

  // If segments are empty (it's the root index page), it's public.
  if (segments.length === 0) {
    return false;
  }
  // Check if the first part of the route (e.g., 'signup' in '/signup') is NOT in the public list.
  // If it's not in the public list, it IS protected.
  return !publicRoutes.includes(segments[0]);
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = initial loading, null = logged out
  const [userRole, setUserRole] = useState<string | null>(null); // State for user role
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(false); // Loading state for role fetching
  const segments = useSegments(); // Get current route segments

  // Tempo Devtools Initialization (separated)
  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
      try {
        const { TempoDevtools } = require("tempo-devtools");
        TempoDevtools.init();
      } catch (e) {
        console.error("Failed to initialize Tempo Devtools:", e);
      }
    }
  }, []); // Empty dependency array ensures this runs only once

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log("Expo push token:", token);
        // Optionally send token to backend here
      }
    });

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Firebase Auth Listener (separated)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed:", currentUser?.uid ?? 'Logged out');
      setUser(currentUser); // Set user to null if logged out, or User object if logged in
    });
    // Cleanup subscription on unmount
    return () => {
      console.log("Unsubscribing from auth state changes.");
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once

  // Fetch User Role when user logs in (separated)
  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        setIsRoleLoading(true);
        setUserRole(null); // Reset role while fetching
        console.log(`Fetching role for user: ${user.uid}`);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("User data fetched:", userData);
            setUserRole(userData.role || null); // Assuming 'role' field exists
          } else {
            console.warn(`No user document found for UID: ${user.uid}`);
            setUserRole(null); // No document found
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null); // Error fetching role
        } finally {
          setIsRoleLoading(false);
        }
      } else {
        // User logged out, clear role
        setUserRole(null);
        setIsRoleLoading(false);
      }
    };

    fetchRole();
  }, [user]); // Rerun when user object changes

  // Handle redirection based on auth state, role, and font loading (separated)
  useEffect(() => {
    const inProtectedRoute = isProtectedRoute(segments);
    // Check if fonts loaded AND initial auth check done AND role fetching (if applicable) is done
    const readyToRedirect = loaded && user !== undefined && (!user || !isRoleLoading);

    console.log("Checking redirect:", { readyToRedirect, loaded, user: user?.uid, isRoleLoading, userRole, segments, inProtectedRoute });

    if (!readyToRedirect) {
      // Still loading fonts, initial auth state, or user role
      console.log("Still loading dependencies for redirection...");
      return;
    }

    // Hide splash screen only when everything is ready
    SplashScreen.hideAsync();

    if (!user && inProtectedRoute) {
      // Logged out but in a protected route, redirect to login
      console.log("Redirecting logged-out user to login...");
      router.replace("/");
    // @ts-ignore - TS incorrectly infers segments types, but this check is valid for root, index, and signup routes
    } else if (user && (segments.length === 0 || segments[0] === 'index' || segments[0] === 'signup')) {
      // Logged in but currently on a public route (login, signup, root index)
      // Redirect based on role
      const targetRoute = userRole === 'manager' ? '/manager' : '/engineer'; // Default to engineer if role is null/invalid
      console.log(`Redirecting logged-in user with role '${userRole}' from public route to ${targetRoute}...`);
      router.replace(targetRoute);
    } else if (user && inProtectedRoute) {
        // Logged in and in a protected route.
        const currentRouteBase = segments[0]; // e.g., 'manager', 'engineer', 'settings'
        const expectedDashboard = userRole === 'manager' ? 'manager' : 'engineer';
        const sharedProtectedRoutes = ['settings', 'notifications', 'report-detail', 'report-form']; // Add any other shared routes

        // Check if the user is trying to access the *other* role's main dashboard area
        // while allowing access to shared routes.
        if (!sharedProtectedRoutes.includes(currentRouteBase) && currentRouteBase !== expectedDashboard) {
            // User is in a protected route that isn't shared AND doesn't match their expected dashboard
            // Example: Manager ('manager') trying to access '/engineer'
            console.warn(`Role/Route mismatch! User role '${userRole}' trying to access '/${currentRouteBase}'. Redirecting to /${expectedDashboard}...`);
            router.replace(`/${expectedDashboard}`);
        } else {
             // User is either on their correct dashboard OR on a shared protected route. No redirect needed.
             console.log(`No redirect needed (logged in, role '${userRole}' is on allowed route '/${segments.join('/')}').`);
        }
    } else {
       console.log("No redirect needed (logged out on public route).");
    }

  }, [loaded, user, userRole, isRoleLoading, segments]); // Rerun effect when loading state, user, role, or route changes


  // Show loading indicator while fonts, auth state, or role are loading
  // Splash screen handles initial load, this covers role fetching after login
  if (!loaded || user === undefined || (user && isRoleLoading)) {
     // Optionally show a minimal loading screen after splash hides if role fetching takes time
     // return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
     return null; // Keep returning null to let splash screen persist longer if needed
  }

  // Render the main app content using Slot
  // Using Slot allows Expo Router to render the appropriate child route
  return (
    <>
      <Slot />
      <StatusBar style="auto" />
    </>
    // If not using Slot or need more complex layout switching:
    // <ThemeProvider value={DefaultTheme}>
    //   {user ? <AppNavigator /> : <AuthNavigator />}
    //   <StatusBar style="auto" />
    // </ThemeProvider>
    // Note: Using Slot is generally the recommended Expo Router way
  );
}

// Removed the explicit Stack definition here, relying on Slot and file-based routing.
// Ensure your file structure defines the routes correctly (e.g., app/index.tsx, app/engineer.tsx etc.)
