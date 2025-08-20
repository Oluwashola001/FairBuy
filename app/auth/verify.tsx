import { supabase } from '@/lib/supabase'; // Make sure path is correct
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const brandColor = '#4B56E9';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert('Error', 'No email found to resend verification.');
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: String(email),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'exp://192.168.43.147:8081/--/auth/verified',
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Verification link has been resent.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Verify Your Email</Text>
      <Text style={styles.subheading}>
        A verification link has been sent to your email. Please click on the link to verify your account.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResendVerification}>
        <Text style={styles.resendText}>Didn't get the link? Tap here to resend</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: brandColor,
    paddingVertical: 18,
    borderRadius: 12,
    width: 320,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  resendText: {
    fontSize: 14,
    color: brandColor,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
