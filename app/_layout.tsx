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
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
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

  // Fetch User Role when user logs in
  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        setIsRoleLoading(true);
        setUserRole(null);
        console.log(`Fetching role for user: ${user.id}`);
        try {
          const userDocRef = doc(require("./config/firebase").db, "users", user.id);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("User data fetched:", userData);
            setUserRole(userData.role || null);
          } else {
            console.warn(`No user document found for UID: ${user.id}`);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        } finally {
          setIsRoleLoading(false);
        }
      } else {
        setUserRole(null);
        setIsRoleLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  // Handle redirection based on auth state, role, and font loading
  useEffect(() => {
    const inProtectedRoute = isProtectedRoute(segments);
    const readyToRedirect = loaded && isLoaded && (!isSignedIn || !isRoleLoading);

    console.log("Checking redirect:", { readyToRedirect, loaded, user: user?.id, isRoleLoading, userRole, segments, inProtectedRoute });

    if (!readyToRedirect) {
      console.log("Still loading dependencies for redirection...");
      return;
    }

    SplashScreen.hideAsync();

    if (!isSignedIn && inProtectedRoute) {
      console.log("Redirecting logged-out user to login...");
      router.replace("/");
} else if (isSignedIn && (!segments[0] || segments[0] === "signup")) {
      const targetRoute = userRole === "manager" ? "/manager" : "/engineer";
      console.log(`Redirecting logged-in user with role '${userRole}' from public route to ${targetRoute}...`);
      router.replace(targetRoute);
    } else if (isSignedIn && inProtectedRoute) {
      const currentRouteBase = segments[0];
      const expectedDashboard = userRole === "manager" ? "manager" : "engineer";
      const sharedProtectedRoutes = ["settings", "notifications", "report-detail", "report-form"];

      if (!sharedProtectedRoutes.includes(currentRouteBase) && currentRouteBase !== expectedDashboard) {
        console.warn(`Role/Route mismatch! User role '${userRole}' trying to access '/${currentRouteBase}'. Redirecting to /${expectedDashboard}...`);
        router.replace(`/${expectedDashboard}`);
      } else {
        console.log(`No redirect needed (logged in, role '${userRole}' is on allowed route '/${segments.join("/")}' ).`);
      }
    } else {
      console.log("No redirect needed (logged out on public route).");
    }
  }, [loaded, user, userRole, isRoleLoading, segments]);

  if (!loaded || !isLoaded || (isSignedIn && isRoleLoading)) {
    return null;
  }

  return (
    <>
      <SignedIn>
        <Slot />
      </SignedIn>
      <SignedOut>
        <Slot />
      </SignedOut>
      <StatusBar style="auto" />
    </>
  );
}
