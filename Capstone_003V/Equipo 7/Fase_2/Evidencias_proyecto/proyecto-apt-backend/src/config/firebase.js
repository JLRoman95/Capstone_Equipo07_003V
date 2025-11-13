import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de Firebase Admin usando credenciales del proyecto
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBT_VrXUzf4rryaAa8EZg5P2mXArrOv1Gc",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "control-de-cosina.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "control-de-cosina",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "control-de-cosina.firebasestorage.app",
};

// Inicializar Firebase Admin sin credenciales de servicio (modo emulador/desarrollo)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
    console.log('✅ Firebase Admin inicializado con credenciales por defecto');
  } catch (error) {
    // Si falla, inicializar sin credenciales (modo público limitado)
    console.warn('⚠️ No se encontraron credenciales de servicio, usando modo limitado');
    // Para desarrollo, usaremos el SDK del cliente desde el frontend
  }
}

export const db = admin.apps.length > 0 ? getFirestore() : null;
export const auth = admin.apps.length > 0 ? admin.auth() : null;

export default admin;
