import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Lee la configuración de Firebase preparada para Vite (import.meta.env.VITE_FIREBASE_*).
 * Si no se ejecuta bajo Vite (por ejemplo en Node puro), permite fallback a process.env.VITE_FIREBASE_*
 * o a src/data/firebaseConfig.local.js.
 */
async function obtenerConfiguracionFirebase() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || (typeof process !== 'undefined' && process.env) || {};

  if (env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID
    };
  }

  try {
    const moduloLocal = await import('./firebaseConfig.local.js');
    return moduloLocal.firebaseConfig;
  } catch {
    throw new Error(
      'Faltan las variables de entorno VITE_FIREBASE_* en .env (o src/data/firebaseConfig.local.js).'
    );
  }
}

/**
 * Inicializa Firebase, autentica al usuario de forma anónima con signInAnonymously
 * y devuelve { db, uid }.
 * @returns {Promise<{ db: import('firebase/firestore').Firestore, uid: string }>}
 */
export async function iniciarFirebase() {
  const firebaseConfig = await obtenerConfiguracionFirebase();
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const credencial = await signInAnonymously(auth);
  const db = getFirestore(app);

  return {
    db,
    uid: credencial.user.uid
  };
}
