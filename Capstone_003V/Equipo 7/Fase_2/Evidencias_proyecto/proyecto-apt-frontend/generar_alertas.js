import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';

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

async function generarAlertasAutomaticas() {
  try {
    console.log('🔄 Generando alertas automáticas del inventario...\n');

    // Limpiar alertas antiguas de inventario
    console.log('🗑️  Limpiando alertas antiguas...');
    const alertasSnapshot = await getDocs(collection(db, 'alertas'));
    let eliminadas = 0;
    for (const alertaDoc of alertasSnapshot.docs) {
      const data = alertaDoc.data();
      if (data.tipo === 'stock_bajo' || data.tipo === 'caducidad' || data.tipo === 'producto_vencido' || data.tipo === 'stock_critico') {
        await deleteDoc(doc(db, 'alertas', alertaDoc.id));
        eliminadas++;
      }
    }
    console.log(`✅ ${eliminadas} alertas antiguas eliminadas\n`);

    // Obtener inventario y productos
    const inventarioSnapshot = await getDocs(collection(db, 'inventario'));
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    
    const inventario = inventarioSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const productos = productosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📦 Analizando ${inventario.length} lotes de inventario...\n`);

    const alertasGeneradas = [];
    const hoy = new Date();

    // Agrupar inventario por producto
    const inventarioPorProducto = {};
    inventario.forEach(lote => {
      const nombreProducto = lote.producto;
      if (!inventarioPorProducto[nombreProducto]) {
        inventarioPorProducto[nombreProducto] = {
          lotes: [],
          totalStock: 0
        };
      }
      
      // Convertir kg/litros a g/ml para el cálculo
      let cantidadEnGramos = lote.cantidad_actual || 0;
      if (lote.unidad_medida === 'kg') cantidadEnGramos *= 1000;
      if (lote.unidad_medida === 'litros') cantidadEnGramos *= 1000;
      
      inventarioPorProducto[nombreProducto].lotes.push(lote);
      inventarioPorProducto[nombreProducto].totalStock += cantidadEnGramos;
    });

    // 1. ALERTAS DE PRODUCTOS VENCIDOS
    console.log('🔴 Verificando productos vencidos...');
    let vencidos = 0;
    inventario.forEach(lote => {
      if (lote.fecha_vencimiento) {
        const fechaVenc = new Date(lote.fecha_vencimiento);
        if (fechaVenc < hoy && lote.cantidad_actual > 0) {
          alertasGeneradas.push({
            tipo: 'producto_vencido',
            prioridad: 'critica',
            titulo: 'Producto Vencido',
            descripcion: `${lote.producto} - Lote ${lote.lote} venció el ${fechaVenc.toLocaleDateString('es-ES')}`,
            producto_nombre: lote.producto,
            numero_lote: lote.lote,
            fecha_caducidad: lote.fecha_vencimiento,
            estado: 'activa',
            fecha: new Date().toISOString()
          });
          vencidos++;
        }
      }
    });
    console.log(`  → ${vencidos} lotes vencidos encontrados`);

    // 2. ALERTAS DE CADUCIDAD PRÓXIMA (7 días)
    console.log('🟡 Verificando caducidad próxima...');
    let porVencer = 0;
    inventario.forEach(lote => {
      if (lote.fecha_vencimiento) {
        const fechaVenc = new Date(lote.fecha_vencimiento);
        const diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes > 0 && diasRestantes <= 7 && lote.cantidad_actual > 0) {
          alertasGeneradas.push({
            tipo: 'caducidad',
            prioridad: diasRestantes <= 3 ? 'alta' : 'media',
            titulo: 'Producto Próximo a Caducar',
            descripcion: `${lote.producto} - Lote ${lote.lote} vence en ${diasRestantes} días`,
            producto_nombre: lote.producto,
            numero_lote: lote.lote,
            dias_restantes: diasRestantes,
            fecha_caducidad: lote.fecha_vencimiento,
            estado: 'activa',
            fecha: new Date().toISOString()
          });
          porVencer++;
        }
      }
    });
    console.log(`  → ${porVencer} lotes próximos a vencer`);

    // 3. ALERTAS DE STOCK BAJO (menos de 5 kg/L)
    console.log('🟠 Verificando stock bajo...');
    let stockBajo = 0;
    Object.entries(inventarioPorProducto).forEach(([nombreProducto, info]) => {
      const stockEnKgOL = info.totalStock / 1000; // Convertir de g/ml a kg/L
      
      if (stockEnKgOL < 5 && stockEnKgOL > 0) {
        const unidad = info.lotes[0]?.unidad_medida || 'kg';
        alertasGeneradas.push({
          tipo: 'stock_bajo',
          prioridad: stockEnKgOL < 2 ? 'alta' : 'media',
          titulo: 'Stock Bajo',
          descripcion: `${nombreProducto} - Stock disponible: ${stockEnKgOL.toFixed(1)} ${unidad}`,
          producto_nombre: nombreProducto,
          stock_actual: stockEnKgOL.toFixed(1),
          unidad_medida: unidad,
          estado: 'activa',
          fecha: new Date().toISOString()
        });
        stockBajo++;
      }
    });
    console.log(`  → ${stockBajo} productos con stock bajo`);

    // 4. ALERTAS DE STOCK CRÍTICO (agotado)
    console.log('🔴 Verificando stock crítico...');
    const todosLosProductos = new Set(productos.map(p => p.nombre));
    const productosConStock = new Set(Object.keys(inventarioPorProducto));
    
    console.log(`  📋 Productos en catálogo: ${todosLosProductos.size}`);
    console.log(`  📦 Productos con stock: ${productosConStock.size}`);
    
    const productosSinStock = [...todosLosProductos].filter(p => !productosConStock.has(p));
    
    if (productosSinStock.length > 0) {
      console.log(`  ⚠️  Productos sin stock:`, productosSinStock);
    }
    
    productosSinStock.forEach(nombreProducto => {
      alertasGeneradas.push({
        tipo: 'stock_critico',
        prioridad: 'critica',
        titulo: 'Stock Agotado',
        descripcion: `${nombreProducto} - Sin stock disponible`,
        producto_nombre: nombreProducto,
        stock_actual: 0,
        estado: 'activa',
        fecha: new Date().toISOString()
      });
    });
    console.log(`  → ${productosSinStock.length} productos sin stock\n`);

    // Guardar alertas en Firestore
    console.log('💾 Guardando alertas en Firestore...');
    for (const alerta of alertasGeneradas) {
      await addDoc(collection(db, 'alertas'), alerta);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMEN DE ALERTAS:');
    console.log('═'.repeat(60));
    console.log(`🔴 Productos vencidos:       ${vencidos}`);
    console.log(`🟡 Próximos a vencer:        ${porVencer}`);
    console.log(`🟠 Stock bajo:               ${stockBajo}`);
    console.log(`🔴 Stock agotado:            ${productosSinStock.length}`);
    console.log('─'.repeat(60));
    console.log(`📌 Total alertas generadas:  ${alertasGeneradas.length}`);
    console.log('═'.repeat(60));
    console.log('\n✅ Alertas generadas exitosamente\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generarAlertasAutomaticas();
