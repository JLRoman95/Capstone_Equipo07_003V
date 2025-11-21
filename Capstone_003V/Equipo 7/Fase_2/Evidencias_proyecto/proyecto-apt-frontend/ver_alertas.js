import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function listarAlertas() {
  try {
    console.log('📋 Listando todas las alertas en Firestore...\n');

    const alertasSnapshot = await getDocs(collection(db, 'alertas'));
    console.log(`📊 Total de alertas: ${alertasSnapshot.size}\n`);

    if (alertasSnapshot.size === 0) {
      console.log('✅ No hay alertas en Firestore\n');
    } else {
      alertasSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. [${data.tipo || 'sin tipo'}] ${data.estado || 'sin estado'}`);
        console.log(`   📝 ${data.descripcion || data.titulo || 'sin descripción'}`);
        console.log(`   📅 ${data.fecha || 'sin fecha'}`);
        console.log(`   🆔 ID: ${doc.id}\n`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listarAlertas();
