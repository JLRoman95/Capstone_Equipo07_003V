import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBT_VrXUzf4rryaAa8EZg5P2mXArrOv1Gc",
  authDomain: "control-de-cosina.firebaseapp.com",
  projectId: "control-de-cosina",
  storageBucket: "control-de-cosina.firebasestorage.app",
  messagingSenderId: "926342756101",
  appId: "1:926342756101:web:ec24711229fdb209c2e96c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function limpiarTodasLasAlertas() {
  try {
    console.log('🗑️  Limpiando TODAS las alertas...\n');

    const alertasSnapshot = await getDocs(collection(db, 'alertas'));
    console.log(`📊 Total de alertas encontradas: ${alertasSnapshot.size}\n`);

    let eliminadas = 0;
    for (const alertaDoc of alertasSnapshot.docs) {
      const data = alertaDoc.data();
      console.log(`  🗑️  ${data.tipo || 'sin tipo'}: ${data.descripcion || data.titulo}`);
      await deleteDoc(doc(db, 'alertas', alertaDoc.id));
      eliminadas++;
    }

    console.log(`\n✅ ${eliminadas} alertas eliminadas\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarTodasLasAlertas();
