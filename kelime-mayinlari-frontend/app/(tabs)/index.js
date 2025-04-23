import { useContext, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';

export default function Index() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return; // <-- HATA BURADA GELİYOR OLABİLİR

    if (user) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [router.isReady, user]);

  return null;
}
