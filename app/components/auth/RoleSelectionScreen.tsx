import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Removed updateDoc (using setDoc with merge)
import { db } from '../../config/firebase';
import { User as UserIcon } from 'lucide-react-native';

const RoleSelectionScreen = () => {
  const params = useLocalSearchParams<{ userId: string }>();
  const { userId } = params;

  // Debug logs for params and userId
  console.log('RoleSelectionScreen: Params received:', JSON.stringify(params));
  console.log('RoleSelectionScreen: userId value:', userId);

  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'engineer' | 'manager' | null>(null);
  const [loading, setLoading] = useState(true); // Start loading true for initial check
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Separate loading state for submission
  const [navigationPath, setNavigationPath] = useState<string | null>(null); // State to trigger navigation

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    // If loading takes more than 5 seconds, force exit the loading state
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.log('RoleSelectionScreen: Safety timeout triggered - forcing loading to false');
        setLoading(false);
        setError('Loading timed out. If you need to set up your profile, please enter your details below.');
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(safetyTimer);
  }, [loading]);

  // Effect to check if user ALREADY completed profile
  useEffect(() => {
    const checkExistingDetails = async () => {
      // Log current userId state
      console.log('RoleSelectionScreen: Running effect, userId =', userId);

      // Wait until userId is available before doing anything
      if (!userId) {
        console.log("RoleSelectionScreen: Waiting for userId... (undefined or empty)");
        // After a short delay, allow the form to show anyway
        setTimeout(() => {
          console.log("RoleSelectionScreen: Timeout reached waiting for userId, showing form anyway");
          setLoading(false);
        }, 2000); // After 2 seconds, show the form even without userId
        return;
      }

      // Now that we have userId, proceed with the check
      console.log(`Checking existing details for user: ${userId}`);
      setError('');

      try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);

        console.log(`RoleSelectionScreen: Firestore doc exists: ${docSnap.exists()}`);
        if (docSnap.exists()) {
          console.log(`RoleSelectionScreen: Doc data:`, JSON.stringify(docSnap.data()));
        }

        // If user doc exists AND has both name and role, they completed setup before. Navigate away.
        if (docSnap.exists() && docSnap.data()?.role && docSnap.data()?.name) {
          console.log(`User ${userId} already has details (Role: ${docSnap.data()?.role}). Navigating.`);
          const existingRole = docSnap.data()?.role;
          // Ensure navigation happens cleanly
          router.replace(existingRole === 'manager' ? '/manager' : '/engineer');
          // Set a fallback in case navigation fails silently
          setTimeout(() => {
            console.log("RoleSelectionScreen: Navigation timeout reached, forcing loading false");
            setLoading(false);
          }, 3000);
          // Return here to prevent setting loading false after navigation starts
          return;
        } else {
          // User needs to complete profile (or doc doesn't exist yet)
          console.log(`User ${userId} needs to complete profile.`);
          setLoading(false); // Stop loading, allow form rendering
        }
      } catch (err) {
        console.error("Error checking existing user details:", err);
        setError("Failed to load user data. Please try again.");
        setLoading(false); // Stop loading on error
      }
    };

    checkExistingDetails();
    // Rerun if userId changes (important for initial load)
  }, [userId]);

  // Effect to handle navigation when navigationPath is set
  useEffect(() => {
    if (navigationPath) {
      console.log(`Navigation Effect: Attempting to navigate to ${navigationPath}`);
      try {
        // Cast needed as string might not match known route types exactly
        router.replace(navigationPath as any);
      } catch (navError) {
        console.error('Navigation error in effect:', navError);
        Alert.alert(
          'Navigation Error',
          'There was a problem navigating to your dashboard after saving. Please restart the app.',
          [{ text: 'OK' }]
        );
        // Optional: Reset path so it doesn't retry automatically?
        // setNavigationPath(null);
      }
    }
  }, [navigationPath]); // Dependency array ensures this runs when navigationPath changes

  // Function to handle saving name and role
  const handleConfirmDetails = async () => {
    if (!userId) {
      setError('User information is missing. Cannot save details.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!selectedRole) {
      setError('Please select your role.');
      return;
    }

    setIsSubmitting(true); // Use separate submitting state
    setError('');

    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        name: name.trim(),
        role: selectedRole,
        updatedAt: new Date(),
        createdAt: new Date(), // Add createdAt timestamp
      }, { merge: true });

      console.log(`Details (Name: "${name.trim()}", Role: "${selectedRole}") saved for user: ${userId}`);

      // Determine destination path
      const destinationPath = selectedRole === 'manager' ? '/manager' : '/engineer';
      console.log(`Setting navigation target to: ${destinationPath}`);

      // Set submitting state false *before* triggering navigation effect
      setIsSubmitting(false);
      // Set the state that will trigger the navigation effect
      setNavigationPath(destinationPath);

    } catch (err: any) {
      console.error('Error saving details:', err);
      setError('Failed to save details. Please try again.');
      Alert.alert('Error', 'Could not save your details.');
      setIsSubmitting(false); // Stop submitting indicator on error
    }
  };

  // Show loading indicator while checking existing details
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text className="mt-3 text-gray-600">Checking user profile...</Text>
      </SafeAreaView>
    );
  }

  // Show error view if loading finished but an error occurred preventing form display
  if (error && !loading) { // Check !loading to ensure check is complete
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 p-6">
        <Text className="text-red-600 text-center text-lg mb-4">Error</Text>
        <Text className="text-red-500 text-center mb-6">{error}</Text>
        <TouchableOpacity onPress={() => router.replace('/')} className="mt-4 p-3 bg-blue-600 rounded-lg">
          <Text className="text-white font-bold">Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render the form if loading is complete and no initial error stopped it
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 p-6">
      <Text className="text-2xl font-bold text-blue-800 mb-6">Complete Your Profile</Text>

      {/* Display form submission error */}
      {error && isSubmitting ? <Text className="text-red-500 mb-4 text-center">{error}</Text> : null}

      {/* Name Input */}
      <View className="w-full mb-4">
        <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-white shadow-sm">
          <UserIcon size={20} color="#4B5563" />
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!isSubmitting} // Disable input while submitting
          />
        </View>
      </View>

      <Text className="text-lg font-semibold text-gray-700 mb-3 self-start">Select Your Role:</Text>

      {/* Role Selection Buttons */}
      <TouchableOpacity
        className={`w-full p-4 rounded-lg mb-4 border-2 ${selectedRole === 'engineer' ? 'bg-green-600 border-green-700 shadow-md' : 'bg-white border-gray-300'}`}
        onPress={() => setSelectedRole('engineer')}
        disabled={isSubmitting}
      >
        <Text className={`text-center font-bold text-lg ${selectedRole === 'engineer' ? 'text-white' : 'text-green-700'}`}>
          Engineer
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`w-full p-4 rounded-lg mb-6 border-2 ${selectedRole === 'manager' ? 'bg-purple-600 border-purple-700 shadow-md' : 'bg-white border-gray-300'}`}
        onPress={() => setSelectedRole('manager')}
        disabled={isSubmitting}
      >
        <Text className={`text-center font-bold text-lg ${selectedRole === 'manager' ? 'text-white' : 'text-purple-700'}`}>
          Manager
        </Text>
      </TouchableOpacity>

      {/* Confirm Button */}
      <TouchableOpacity
        className={`w-full p-4 rounded-lg shadow-md ${isSubmitting || !name || !selectedRole ? 'bg-blue-300' : 'bg-blue-600'}`}
        onPress={handleConfirmDetails}
        disabled={isSubmitting || !name || !selectedRole}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">Confirm Details & Continue</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default RoleSelectionScreen;
