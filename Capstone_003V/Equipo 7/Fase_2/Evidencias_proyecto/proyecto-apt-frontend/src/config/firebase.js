import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuración de Firebase - Control de Cosina
const firebaseConfig = {
  apiKey: "AIzaSyBT_VrXUzf4rryaAa8EZg5P2mXArrOv1Gc",
  authDomain: "control-de-cosina.firebaseapp.com",
  projectId: "control-de-cosina",
  storageBucket: "control-de-cosina.firebasestorage.app",
  messagingSenderId: "926342756101",
  appId: "1:926342756101:web:ec24711229fdb209c2e96c",
  measurementId: "G-M64G55EJEL"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
