import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Lee la configuración de Firebase exclusivamente desde import.meta.env.VITE_FIREBASE_*.
 * Si falta VITE_FIREBASE_API_KEY lanza un error claro.
 */
function obtenerConfiguracionFirebase() {
  const env = import.meta.env;

  if (!env || !env.VITE_FIREBASE_API_KEY) {
    throw new Error(
      'Falta VITE_FIREBASE_API_KEY en import.meta.env. Configurá las variables VITE_FIREBASE_* en .env.local.'
    );
  }

  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };
}

/**
 * Inicializa Firebase, autentica al usuario de forma anónima con signInAnonymously
 * y devuelve { db, uid }.
 * @returns {Promise<{ db: import('firebase/firestore').Firestore, uid: string }>}
 */
export async function iniciarFirebase() {
  const firebaseConfig = obtenerConfiguracionFirebase();
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const credencial = await signInAnonymously(auth);
  const db = getFirestore(app);

  return {
    db,
    uid: credencial.user.uid
  };
}
