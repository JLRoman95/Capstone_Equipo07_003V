import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

// Mapeo de productos a unidades de medida
const unidadesPorProducto = {
  // Líquidos (litros)
  'Leche Entera': 'litros',
  'Aceite Vegetal': 'litros',
  
  // Carnes y proteínas (kg)
  'Carne Molida': 'kg',
  'Pollo Entero': 'kg',
  
  // Verduras (kg)
  'Cebolla': 'kg',
  'Tomate': 'kg',
  'Lechuga': 'kg',
  
  // Cereales y granos (kg)
  'Arroz Grado 1': 'kg',
  
  // Productos de panadería (kg)
  'Pan Marraqueta': 'kg',
  
  // Lácteos sólidos (kg)
  'Queso Mantecoso': 'kg'
};

async function actualizarUnidadesInventario() {
  try {
    console.log('🔄 Actualizando unidades de medida en inventario...\n');

    const snapshot = await getDocs(collection(db, 'inventario'));
    
    let actualizados = 0;
    let noEncontrados = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const producto = data.producto;
      const unidad = unidadesPorProducto[producto];

      if (unidad) {
        // Actualizar el documento con la unidad de medida
        await updateDoc(doc(db, 'inventario', docSnap.id), {
          unidad_medida: unidad
        });
        
        console.log(`✅ ${producto}: ${data.cantidad_actual} ${unidad}`);
        actualizados++;
      } else {
        noEncontrados.push(producto);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Items actualizados: ${actualizados}`);
    console.log(`   - Items sin mapeo: ${noEncontrados.length}`);
    
    if (noEncontrados.length > 0) {
      console.log(`\n⚠️  Productos sin unidad definida:`);
      [...new Set(noEncontrados)].forEach(p => console.log(`   - ${p}`));
    }

    console.log('\n✅ Actualización completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarUnidadesInventario();
