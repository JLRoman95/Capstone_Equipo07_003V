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

// Generar código de producto basado en nombre y categoría
function generarCodigoProducto(nombre, categoria, indice) {
  // Primeras 3 letras del nombre (mayúsculas, sin espacios)
  const nombreCorto = nombre.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  
  // Primeras 2 letras de la categoría (mayúsculas)
  const categoriaCorta = (categoria || 'GEN').replace(/\s+/g, '').substring(0, 2).toUpperCase();
  
  // Número secuencial de 3 dígitos
  const numero = String(indice).padStart(3, '0');
  
  return `${nombreCorto}-${categoriaCorta}-${numero}`;
}

async function asignarCodigosProductos() {
  try {
    console.log('🔄 Asignando códigos únicos a productos...\n');

    // Obtener todos los productos
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const productos = productosSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    console.log(`📦 Total de productos: ${productos.size}\n`);

    // Agrupar productos por nombre para detectar duplicados
    const productosPorNombre = new Map();
    
    productos.forEach(producto => {
      const nombre = producto.nombre;
      if (!productosPorNombre.has(nombre)) {
        productosPorNombre.set(nombre, []);
      }
      productosPorNombre.get(nombre).push(producto);
    });

    console.log(`📊 Productos únicos por nombre: ${productosPorNombre.size}\n`);

    let contador = 1;
    let actualizados = 0;
    const codigosAsignados = new Map();

    // Procesar cada grupo de productos
    for (const [nombre, productosGrupo] of productosPorNombre) {
      // Generar código para este producto
      const primerProducto = productosGrupo[0];
      const codigo = generarCodigoProducto(nombre, primerProducto.categoria, contador);
      
      codigosAsignados.set(nombre, codigo);
      
      console.log(`${contador}. ${nombre}`);
      console.log(`   📝 Código asignado: ${codigo}`);
      console.log(`   📦 Documentos con este nombre: ${productosGrupo.length}`);
      
      // Asignar el mismo código a todos los productos con el mismo nombre
      for (const producto of productosGrupo) {
        await updateDoc(doc(db, 'productos', producto.id), {
          codigo_producto: codigo
        });
        console.log(`      → Actualizado doc ID: ${producto.id}`);
        actualizados++;
      }
      
      console.log('');
      contador++;
    }

    console.log('═'.repeat(60));
    console.log(`\n📊 RESUMEN:`);
    console.log(`   - Productos únicos: ${productosPorNombre.size}`);
    console.log(`   - Documentos actualizados: ${actualizados}`);
    console.log(`   - Códigos generados: ${codigosAsignados.size}`);
    
    console.log('\n📋 CÓDIGOS ASIGNADOS:');
    console.log('═'.repeat(60));
    for (const [nombre, codigo] of codigosAsignados) {
      console.log(`${codigo} → ${nombre}`);
    }
    
    console.log('\n✅ Códigos asignados exitosamente\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

asignarCodigosProductos();
