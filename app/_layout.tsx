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

// Helper function to determine if a route is protected, ignoring hash fragments
const isProtectedRoute = (segments: string[]) => {
  // Define routes that should be accessible ONLY when logged out
  const publicRoutes = ['index', 'signup'];

  // Get the first segment, stripping any hash fragment if present
  const firstSegment = segments[0]?.split('#')[0];

  // If segments are empty or the first segment (without hash) is empty, it's the root index page (public).
  if (segments.length === 0 || !firstSegment) {
    return false;
  }
  // Check if the first segment (without hash) is NOT in the public list.
  // If it's not public, it's considered protected.
  return !publicRoutes.includes(firstSegment);
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
    console.log("Setting up Firebase Auth listener..."); // Added log
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed! Received user:", currentUser?.uid ?? 'null'); // Modified log
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

    console.log("Checking redirect:", { readyToRedirect, loaded, user: user?.uid, isRoleLoading, userRole, segments: segments.join('/'), inProtectedRoute }); // Log segments joined

    if (!readyToRedirect) {
      // Still loading fonts, initial auth state, or user role
      console.log("Redirection check: Not ready yet."); // Added log
      return;
    }

    // Hide splash screen only when everything is ready
    SplashScreen.hideAsync();

    // Calculate currentRoute ignoring the hash fragment
    const pathSegments = segments.map(s => s.split('#')[0]); // Remove hash from each segment
    const currentRoute = pathSegments.join('/') || 'index'; // Join segments without hash
    const fullRouteWithHash = segments.join('/') || 'index'; // Keep original for logging if needed

    console.log(`Redirection check: Ready. Current Route (parsed): /${currentRoute}, Full Route: /${fullRouteWithHash}, User: ${user?.uid}, Role: ${userRole}`); // Updated log

    if (!user) {
      // --- User is Logged Out ---
      if (inProtectedRoute) {
        // Logged out but trying to access a protected route
        console.log(`Redirection decision: Logged out on protected route /${currentRoute}. Replacing with /`); // Added log
        router.replace("/");
      } else {
        // Logged out and on a public route (index or signup) - stay there
        console.log(`Redirection decision: Logged out on public route /${currentRoute}. No redirect.`); // Added log
      }
    } else {
      // --- User is Logged In ---
      if (!userRole) {
        // Logged in, role check complete, but NO role assigned
        if (currentRoute !== 'select-role') {
          // If not already on the select-role screen, redirect there
          console.log(`Redirection decision: Logged in (UID ${user.uid}), no role, not on /select-role. Replacing with /select-role`); // Added log
          router.replace('/select-role');
        } else {
          // Already on the select-role screen, stay there
          console.log(`Redirection decision: Logged in (UID ${user.uid}), no role, already on /select-role. No redirect.`); // Added log
        }
      } else {
        // Logged in AND has a role assigned
        const expectedDashboard = userRole === 'manager' ? '/manager' : '/engineer';
        const sharedProtectedRoutes = ['settings', 'notifications', 'report-detail', 'report-form']; // Add any other shared routes
        const isOnAuthRoute = currentRoute === 'index' || currentRoute === 'signup' || currentRoute === 'select-role';

        if (isOnAuthRoute) {
           // Logged in with role, but currently on login, signup, or select-role screen. Redirect to dashboard.
           console.log(`Redirection decision: Logged in (UID ${user.uid}), role ${userRole}, on auth route /${currentRoute}. Replacing with ${expectedDashboard}`); // Added log
           router.replace(expectedDashboard);
        } else if (inProtectedRoute) {
          // Logged in, has role, and is on a protected route - check for role mismatch
          const currentRouteBase = segments[0];
          if (!sharedProtectedRoutes.includes(currentRouteBase) && `/${currentRouteBase}` !== expectedDashboard) {
            // Trying to access another role's main area (and it's not a shared route)
            console.warn(`Redirection decision: Role/Route mismatch! User (UID ${user.uid}) role '${userRole}' on /${currentRouteBase}. Replacing with ${expectedDashboard}`); // Added log
            router.replace(expectedDashboard);
          } else {
            // On their correct dashboard or a shared protected route - stay there
            console.log(`Redirection decision: Logged in (UID ${user.uid}), role ${userRole}, allowed route /${currentRoute}. No redirect.`); // Added log
          }
        } else {
             // This case handles being logged in with a role but on a non-protected, non-auth route (e.g., index after login?)
             console.warn(`Redirection decision: Logged in (UID ${user.uid}), role ${userRole}, unexpected state on public route /${currentRoute}. Replacing with ${expectedDashboard}`); // Added log + clarification
             router.replace(expectedDashboard);
        }
      }
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
