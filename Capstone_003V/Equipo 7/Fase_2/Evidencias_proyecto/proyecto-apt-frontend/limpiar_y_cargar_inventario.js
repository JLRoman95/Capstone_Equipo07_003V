import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

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
  'Leche Entera': 'litros',
  'Aceite Vegetal': 'litros',
  'Carne Molida': 'kg',
  'Pollo Entero': 'kg',
  'Cebolla': 'kg',
  'Tomate': 'kg',
  'Lechuga': 'kg',
  'Arroz Grado 1': 'kg',
  'Pan Marraqueta': 'kg',
  'Queso Mantecoso': 'kg'
};

// Días de vida útil promedio por producto
const diasVidaUtil = {
  'Leche Entera': 7,          // 7 días refrigerada
  'Aceite Vegetal': 365,      // 1 año
  'Carne Molida': 3,          // 3 días refrigerada
  'Pollo Entero': 5,          // 5 días refrigerado
  'Cebolla': 30,              // 1 mes
  'Tomate': 7,                // 7 días
  'Lechuga': 5,               // 5 días
  'Arroz Grado 1': 365,       // 1 año
  'Pan Marraqueta': 2,        // 2 días
  'Queso Mantecoso': 30       // 30 días refrigerado
};

async function limpiarYCargarInventario() {
  try {
    console.log('🗑️  PASO 1: Eliminando lotes existentes del inventario...\n');

    // Eliminar todos los lotes del inventario
    const inventarioSnapshot = await getDocs(collection(db, 'inventario'));
    let eliminados = 0;
    
    for (const docSnap of inventarioSnapshot.docs) {
      await deleteDoc(doc(db, 'inventario', docSnap.id));
      eliminados++;
    }
    
    console.log(`✅ ${eliminados} lotes eliminados\n`);

    console.log('📦 PASO 2: Obteniendo productos y proveedores...\n');

    // Obtener todos los productos
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const productos = productosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Total de productos encontrados: ${productos.length}\n`);

    // Agrupar productos por proveedor
    const productosPorProveedor = {};
    productos.forEach(producto => {
      const proveedor = producto.proveedor || 'Sin Proveedor';
      if (!productosPorProveedor[proveedor]) {
        productosPorProveedor[proveedor] = [];
      }
      productosPorProveedor[proveedor].push(producto);
    });

    console.log('📦 PASO 3: Cargando inventario por proveedor...\n');

    let totalCargados = 0;
    const hoy = new Date();

    // Cargar inventario agrupado por proveedor
    for (const [proveedor, productosProveedor] of Object.entries(productosPorProveedor)) {
      console.log(`\n🏪 Proveedor: ${proveedor} (${productosProveedor.length} productos)`);
      console.log('─'.repeat(60));

      for (const producto of productosProveedor) {
        const nombreProducto = producto.nombre;
        const unidad = unidadesPorProducto[nombreProducto] || 'kg';
        const diasVida = diasVidaUtil[nombreProducto] || 30; // 30 días por defecto
        
        // Calcular fecha de vencimiento según vida útil del producto
        const fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasVida);
        
        // Crear lote de inventario
        const lote = {
          producto: nombreProducto,
          codigo_producto: producto.codigo_producto || producto.id,
          cantidad_actual: 30,
          unidad_medida: unidad,
          estado: 'disponible',
          proveedor: proveedor,
          lote: `L${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}_${producto.id.substring(0, 4)}`,
          fecha_ingreso: hoy.toISOString().split('T')[0],
          fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
          creado_en: new Date().toISOString()
        };

        await addDoc(collection(db, 'inventario'), lote);
        console.log(`  ✅ ${nombreProducto}: 30 ${unidad} (vence: ${diasVida} días)`);
        totalCargados++;
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`   - Lotes eliminados: ${eliminados}`);
    console.log(`   - Lotes nuevos cargados: ${totalCargados}`);
    console.log(`   - Proveedores procesados: ${Object.keys(productosPorProveedor).length}`);
    console.log(`   - Cantidad por producto: 30 kg/litros`);
    console.log(`   - Vencimientos: según vida útil de cada producto`);
    console.log('\n✅ Proceso completado exitosamente\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

limpiarYCargarInventario();
