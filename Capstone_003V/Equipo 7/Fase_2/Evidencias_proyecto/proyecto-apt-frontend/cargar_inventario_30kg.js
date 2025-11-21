import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';

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

async function cargarInventario30kg() {
  try {
    console.log('📦 Cargando inventario de 30 kg/litros para todos los productos...\n');

    // Obtener todos los productos
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    
    let cargados = 0;
    const hoy = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 90); // 90 días de vigencia

    for (const productoDoc of productosSnapshot.docs) {
      const producto = productoDoc.data();
      const nombreProducto = producto.nombre;
      
      // Determinar unidad de medida
      const unidad = unidadesPorProducto[nombreProducto] || 'kg';
      
      // Crear lote de inventario
      const lote = {
        producto: nombreProducto,
        cantidad_actual: 30,
        unidad_medida: unidad,
        estado: 'disponible',
        lote: `L${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}_${productoDoc.id.substring(0, 4)}`,
        fecha_ingreso: hoy.toISOString().split('T')[0],
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
        creado_en: new Date().toISOString()
      };

      await addDoc(collection(db, 'inventario'), lote);
      console.log(`✅ ${nombreProducto}: 30 ${unidad} (Lote: ${lote.lote})`);
      cargados++;
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Total de productos cargados: ${cargados}`);
    console.log(`   - Cantidad por producto: 30 kg/litros`);
    console.log(`   - Fecha de vencimiento: ${fechaVencimiento.toISOString().split('T')[0]}`);

    console.log('\n✅ Inventario cargado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cargarInventario30kg();
