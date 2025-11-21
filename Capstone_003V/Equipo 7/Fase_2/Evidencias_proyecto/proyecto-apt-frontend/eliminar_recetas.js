import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBEWUFLlUcihyMwUKPMVdnGhLHe_VHs0Pc",
  authDomain: "control-de-cosina.firebaseapp.com",
  projectId: "control-de-cosina",
  storageBucket: "control-de-cosina.firebasestorage.app",
  messagingSenderId: "722664288704",
  appId: "1:722664288704:web:a89f7f3a0b4b9c0e8a0b9c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function eliminarTodasLasRecetas() {
  console.log('🗑️ Eliminando todas las recetas...\n');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'recetas'));
    
    if (querySnapshot.empty) {
      console.log('✅ No hay recetas para eliminar');
      process.exit(0);
    }
    
    let contador = 0;
    for (const docSnap of querySnapshot.docs) {
      await deleteDoc(doc(db, 'recetas', docSnap.id));
      const data = docSnap.data();
      console.log(`✅ Eliminada: ${data.nombre}`);
      contador++;
    }
    
    console.log(`\n🎉 Total de recetas eliminadas: ${contador}`);
    
  } catch (error) {
    console.error('❌ Error al eliminar recetas:', error);
  }
  
  process.exit(0);
}

eliminarTodasLasRecetas();
