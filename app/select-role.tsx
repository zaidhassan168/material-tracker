import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase'; // Assuming config is here
import { UserCheck, Briefcase } from 'lucide-react-native'; // Example icons

const SelectRoleScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelection = async (role: 'manager' | 'engineer') => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No authenticated user found. Please log in again.');
      router.replace('/'); // Redirect to login
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        role: role,
        updatedAt: new Date(), // Update timestamp
      });
      console.log(`Role '${role}' saved successfully for user: ${user.uid}`);

      // Navigate to the appropriate dashboard based on the selected role
      if (role === 'manager') {
        router.replace('/manager');
      } else {
        router.replace('/engineer');
      }
    } catch (err) {
      console.error('Error saving role:', err);
      setError('Failed to save your role. Please try again.');
      Alert.alert('Error', 'Could not save your role selection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose how you will use the app.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, styles.managerButton]}
          onPress={() => handleRoleSelection('manager')}
          disabled={loading}
        >
          <Briefcase size={24} color="#ffffff" style={styles.icon} />
          <Text style={styles.buttonText}>Manager</Text>
          {loading && <ActivityIndicator size="small" color="#ffffff" style={styles.loader} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.engineerButton]}
          onPress={() => handleRoleSelection('engineer')}
          disabled={loading}
        >
          <UserCheck size={24} color="#ffffff" style={styles.icon} />
          <Text style={styles.buttonText}>Engineer</Text>
          {loading && <ActivityIndicator size="small" color="#ffffff" style={styles.loader} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // bg-gray-100
    justifyContent: 'center',
  },
  content: {
    padding: 24, // p-6
    alignItems: 'center',
  },
  title: {
    fontSize: 28, // text-3xl approx
    fontWeight: 'bold',
    color: '#1E3A8A', // text-blue-800
    marginBottom: 8, // mb-2
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16, // text-base
    color: '#6B7280', // text-gray-500
    marginBottom: 32, // mb-8
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16, // p-4
    paddingHorizontal: 24,
    borderRadius: 8, // rounded-lg
    marginBottom: 16, // mb-4
    minHeight: 60, // Ensure consistent height
  },
  managerButton: {
    backgroundColor: '#1D4ED8', // bg-blue-700
  },
  engineerButton: {
    backgroundColor: '#047857', // bg-emerald-600
  },
  buttonText: {
    color: '#ffffff', // text-white
    fontSize: 18, // text-lg
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1, // Allow text to take space but center overall
  },
  icon: {
    marginRight: 12,
    position: 'absolute', // Position icon independently
    left: 24,
  },
  loader: {
    position: 'absolute', // Position loader independently
    right: 24,
  },
  errorText: {
    color: '#DC2626', // text-red-600
    marginBottom: 16, // mb-4
    textAlign: 'center',
  },
});

export default SelectRoleScreen;
