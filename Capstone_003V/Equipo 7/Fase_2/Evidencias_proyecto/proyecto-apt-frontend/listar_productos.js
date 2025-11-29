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

async function listarProductos() {
  console.log('📦 Listando productos en Firestore...\n');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'productos'));
    
    if (querySnapshot.empty) {
      console.log('⚠️ No hay productos en la base de datos');
      process.exit(0);
    }
    
    const productos = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      productos.push({
        id: doc.id,
        codigo: data.codigo_producto || doc.id, // Usar ID si no hay código
        nombre: data.nombre,
        categoria: data.categoria
      });
    });
    
    // Agrupar por nombre para evitar duplicados
    const productosUnicos = {};
    productos.forEach(p => {
      if (!productosUnicos[p.nombre]) {
        productosUnicos[p.nombre] = p;
      }
    });
    
    const listaUnica = Object.values(productosUnicos);
    
    console.log(`📊 Total de productos únicos: ${listaUnica.length}\n`);
    console.log('=' .repeat(80));
    listaUnica.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.nombre}`);
      console.log(`   ID/Código: ${p.codigo}`);
      console.log(`   Categoría: ${p.categoria || 'Sin categoría'}`);
      console.log('-'.repeat(80));
    });
    
  } catch (error) {
    console.error('❌ Error al listar productos:', error);
  }
  
  process.exit(0);
}

listarProductos();
