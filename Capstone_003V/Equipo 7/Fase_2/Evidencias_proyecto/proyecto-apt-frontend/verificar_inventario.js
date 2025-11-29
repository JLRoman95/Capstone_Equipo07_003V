import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function verificarInventario() {
  console.log('📦 Verificando estructura de inventario...\n');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'inventario'));
    
    if (querySnapshot.empty) {
      console.log('⚠️ No hay inventario en la base de datos');
      process.exit(0);
    }
    
    console.log(`📊 Total de items en inventario: ${querySnapshot.size}\n`);
    
    // Tomar primer item como muestra
    const primerItem = querySnapshot.docs[0];
    const data = primerItem.data();
    
    console.log('Estructura de un item de inventario:');
    console.log('=====================================');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

verificarInventario();
