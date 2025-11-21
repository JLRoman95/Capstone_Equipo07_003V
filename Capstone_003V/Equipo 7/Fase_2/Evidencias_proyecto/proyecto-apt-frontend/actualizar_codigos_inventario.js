import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function actualizarCodigosInventario() {
  try {
    console.log('🔄 Actualizando códigos de producto en inventario...\n');

    // Obtener todos los productos con sus códigos
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const codigosPorNombre = new Map();
    
    productosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.codigo_producto && data.nombre) {
        codigosPorNombre.set(data.nombre, data.codigo_producto);
      }
    });

    console.log(`📦 Productos con código: ${codigosPorNombre.size}\n`);

    // Obtener inventario
    const inventarioSnapshot = await getDocs(collection(db, 'inventario'));
    
    let actualizados = 0;
    let sinCodigo = 0;

    console.log('📝 Actualizando inventario...\n');

    for (const invDoc of inventarioSnapshot.docs) {
      const data = invDoc.data();
      const nombreProducto = data.producto;
      
      if (nombreProducto && codigosPorNombre.has(nombreProducto)) {
        const codigo = codigosPorNombre.get(nombreProducto);
        
        await updateDoc(doc(db, 'inventario', invDoc.id), {
          codigo_producto: codigo
        });
        
        console.log(`✅ ${nombreProducto} → ${codigo}`);
        actualizados++;
      } else {
        console.log(`⚠️  Sin código: ${nombreProducto || 'producto sin nombre'}`);
        sinCodigo++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`📊 RESUMEN:`);
    console.log(`   - Lotes actualizados: ${actualizados}`);
    console.log(`   - Lotes sin código: ${sinCodigo}`);
    console.log('\n✅ Inventario actualizado\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarCodigosInventario();
