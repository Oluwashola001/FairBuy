// app/--/auth/callback.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/verified');
  }, []);

  return null;
}
