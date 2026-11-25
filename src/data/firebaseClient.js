import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Carga la configuración desde variables de entorno o desde el archivo local
 * src/data/firebaseConfig.local.js (que está en .gitignore para no exponer claves en el repositorio).
 */
async function cargarConfiguracionFirebase() {
  if (typeof process !== 'undefined' && process.env && process.env.FIREBASE_API_KEY) {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    };
  }

  try {
    const moduloLocal = await import('./firebaseConfig.local.js');
    return moduloLocal.firebaseConfig;
  } catch {
    throw new Error(
      'No se encontró src/data/firebaseConfig.local.js ni variables de entorno FIREBASE_*. ' +
        'Copiá src/data/firebaseConfig.example.js a src/data/firebaseConfig.local.js con tus credenciales.'
    );
  }
}

const firebaseConfig = await cargarConfiguracionFirebase();

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
