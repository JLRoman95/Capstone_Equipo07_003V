import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBT_VrXUzf4rryaAa8EZg5P2mXArrOv1Gc",
  authDomain: "control-de-cosina.firebaseapp.com",
  projectId: "control-de-cosina",
  storageBucket: "control-de-cosina.firebasestorage.app",
  messagingSenderId: "926342756101",
  appId: "1:926342756101:web:ec24711229fdb209c2e96c",
  measurementId: "G-M64G55EJEL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// DATOS DE MUESTRA
// ============================================

const datosProveedores = [
  { nombre: "Distribuidora Alimentos S.A.", contacto: "Juan Pérez", telefono: "+56912345678", email: "contacto@distalimentos.cl" },
  { nombre: "Carnes Premium Ltda.", contacto: "María González", telefono: "+56987654321", email: "ventas@carnespremium.cl" },
  { nombre: "Verduras Frescas del Sur", contacto: "Pedro Ramírez", telefono: "+56956781234", email: "info@verdurassur.cl" },
  { nombre: "Lácteos del Valle", contacto: "Ana Martínez", telefono: "+56923456789", email: "pedidos@lacteosvallle.cl" },
  { nombre: "Panadería El Trigal", contacto: "Carlos Soto", telefono: "+56934567890", email: "ventas@eltrigal.cl" }
];

const datosProductos = [
  { nombre: "Arroz Grado 1", codigo: "ARR001", categoria: "Granos", unidad_medida: "kg", proveedor: "Distribuidora Alimentos S.A.", stock_actual: 150, stock_minimo: 50 },
  { nombre: "Pollo Entero", codigo: "POL001", categoria: "Carnes", unidad_medida: "kg", proveedor: "Carnes Premium Ltda.", stock_actual: 80, stock_minimo: 30 },
  { nombre: "Carne Molida", codigo: "CAR001", categoria: "Carnes", unidad_medida: "kg", proveedor: "Carnes Premium Ltda.", stock_actual: 45, stock_minimo: 20 },
  { nombre: "Lechuga", codigo: "VER001", categoria: "Verduras", unidad_medida: "unidad", proveedor: "Verduras Frescas del Sur", stock_actual: 120, stock_minimo: 40 },
  { nombre: "Tomate", codigo: "VER002", categoria: "Verduras", unidad_medida: "kg", proveedor: "Verduras Frescas del Sur", stock_actual: 90, stock_minimo: 30 },
  { nombre: "Cebolla", codigo: "VER003", categoria: "Verduras", unidad_medida: "kg", proveedor: "Verduras Frescas del Sur", stock_actual: 110, stock_minimo: 35 },
  { nombre: "Leche Entera", codigo: "LAC001", categoria: "Lácteos", unidad_medida: "litro", proveedor: "Lácteos del Valle", stock_actual: 200, stock_minimo: 80 },
  { nombre: "Queso Mantecoso", codigo: "LAC002", categoria: "Lácteos", unidad_medida: "kg", proveedor: "Lácteos del Valle", stock_actual: 25, stock_minimo: 10 },
  { nombre: "Pan Marraqueta", codigo: "PAN001", categoria: "Panadería", unidad_medida: "unidad", proveedor: "Panadería El Trigal", stock_actual: 300, stock_minimo: 100 },
  { nombre: "Aceite Vegetal", codigo: "ACE001", categoria: "Aceites", unidad_medida: "litro", proveedor: "Distribuidora Alimentos S.A.", stock_actual: 60, stock_minimo: 25 }
];

const datosInventario = [
  { producto: "Arroz Grado 1", lote: "L20241101", cantidad_actual: 150, fecha_ingreso: "2024-11-01", fecha_vencimiento: "2025-05-01", estado: "disponible" },
  { producto: "Pollo Entero", lote: "L20241110", cantidad_actual: 80, fecha_ingreso: "2024-11-10", fecha_vencimiento: "2024-11-20", estado: "disponible" },
  { producto: "Carne Molida", lote: "L20241112", cantidad_actual: 45, fecha_ingreso: "2024-11-12", fecha_vencimiento: "2024-11-18", estado: "disponible" },
  { producto: "Lechuga", lote: "L20241113", cantidad_actual: 120, fecha_ingreso: "2024-11-13", fecha_vencimiento: "2024-11-20", estado: "disponible" },
  { producto: "Tomate", lote: "L20241113", cantidad_actual: 90, fecha_ingreso: "2024-11-13", fecha_vencimiento: "2024-11-23", estado: "disponible" },
  { producto: "Leche Entera", lote: "L20241108", cantidad_actual: 200, fecha_ingreso: "2024-11-08", fecha_vencimiento: "2024-11-25", estado: "disponible" },
  { producto: "Pan Marraqueta", lote: "L20241113", cantidad_actual: 300, fecha_ingreso: "2024-11-13", fecha_vencimiento: "2024-11-14", estado: "disponible" },
  { producto: "Aceite Vegetal", lote: "L20241105", cantidad_actual: 60, fecha_ingreso: "2024-11-05", fecha_vencimiento: "2025-11-05", estado: "disponible" }
];

const datosProduccion = [
  { fecha: "2024-11-13", responsable: "Jorge González", turno: "Mañana", producto: "Arroz Cocido", cantidad: 50, temp_coccion: 95, hora: "09:30", observaciones: "Cocción normal" },
  { fecha: "2024-11-13", responsable: "María López", turno: "Mañana", producto: "Pollo Asado", cantidad: 30, temp_coccion: 180, hora: "10:00", observaciones: "Dorado perfecto" },
  { fecha: "2024-11-13", responsable: "Pedro Soto", turno: "Tarde", producto: "Ensalada Mixta", cantidad: 40, temp_coccion: null, hora: "14:00", observaciones: "Verduras frescas" },
  { fecha: "2024-11-12", responsable: "Ana Ramírez", turno: "Mañana", producto: "Carne Guisada", cantidad: 25, temp_coccion: 85, hora: "11:00", observaciones: "Cocción lenta" },
  { fecha: "2024-11-12", responsable: "Jorge González", turno: "Tarde", producto: "Pan Tostado", cantidad: 100, temp_coccion: 200, hora: "15:30", observaciones: "Horneado correcto" }
];

const datosChecklists = [
  { 
    fecha: "2024-11-13", 
    turno: "Mañana", 
    responsable: "Jorge González", 
    categoria: "Limpieza Cocina",
    estado: "completo",
    items: [
      { descripcion: "Mesas de trabajo", resultado: "ok", observacion: "" },
      { descripcion: "Cuchillos y utensilios", resultado: "ok", observacion: "" },
      { descripcion: "Lavaplatos / fregadero", resultado: "ok", observacion: "" },
      { descripcion: "Refrigeradores / Freezer", resultado: "ok", observacion: "Temperatura correcta" },
      { descripcion: "Suelo / paredes / drenajes", resultado: "ok", observacion: "" },
      { descripcion: "Campana extractora", resultado: "no_ok", observacion: "Requiere limpieza profunda" },
      { descripcion: "Basureros / contenedores", resultado: "ok", observacion: "" }
    ]
  },
  { 
    fecha: "2024-11-13", 
    turno: "Tarde", 
    responsable: "María López", 
    categoria: "Limpieza Cocina",
    estado: "completo",
    items: [
      { descripcion: "Mesas de trabajo", resultado: "ok", observacion: "" },
      { descripcion: "Cuchillos y utensilios", resultado: "ok", observacion: "" },
      { descripcion: "Lavaplatos / fregadero", resultado: "ok", observacion: "" },
      { descripcion: "Refrigeradores / Freezer", resultado: "ok", observacion: "" },
      { descripcion: "Suelo / paredes / drenajes", resultado: "ok", observacion: "" },
      { descripcion: "Campana extractora", resultado: "ok", observacion: "" },
      { descripcion: "Basureros / contenedores", resultado: "ok", observacion: "" }
    ]
  },
  { 
    fecha: "2024-11-12", 
    turno: "Noche", 
    responsable: "Pedro Soto", 
    categoria: "Limpieza Cocina",
    estado: "pendiente",
    items: []
  }
];

const datosAlertas = [
  { tipo: "stock_bajo", producto: "Queso Mantecoso", mensaje: "Stock bajo: 25 unidades (mínimo: 10)", nivel: "warning", fecha: "2024-11-13", estado: "activa" },
  { tipo: "proximo_vencer", producto: "Pan Marraqueta", mensaje: "Vence mañana (2024-11-14)", nivel: "warning", fecha: "2024-11-13", estado: "activa" },
  { tipo: "proximo_vencer", producto: "Carne Molida", mensaje: "Vence en 5 días (2024-11-18)", nivel: "info", fecha: "2024-11-13", estado: "activa" },
  { tipo: "checklist_pendiente", responsable: "Pedro Soto", mensaje: "Checklist de turno Noche pendiente", nivel: "danger", fecha: "2024-11-12", estado: "activa" }
];

// ============================================
// FUNCIÓN PARA CARGAR DATOS
// ============================================

async function cargarDatosMuestra() {
  console.log('🔥 Iniciando carga de datos de muestra...\n');

  try {
    // 1. PROVEEDORES
    console.log('📦 Cargando Proveedores...');
    for (const proveedor of datosProveedores) {
      const docRef = await addDoc(collection(db, 'proveedores'), {
        ...proveedor,
        creado_en: new Date().toISOString()
      });
      console.log(`  ✅ ${proveedor.nombre} (ID: ${docRef.id})`);
    }

    // 2. PRODUCTOS
    console.log('\n🥘 Cargando Productos...');
    for (const producto of datosProductos) {
      const docRef = await addDoc(collection(db, 'productos'), {
        ...producto,
        creado_en: new Date().toISOString()
      });
      console.log(`  ✅ ${producto.nombre} (${producto.codigo})`);
    }

    // 3. INVENTARIO
    console.log('\n📋 Cargando Inventario...');
    for (const item of datosInventario) {
      const docRef = await addDoc(collection(db, 'inventario'), {
        ...item,
        creado_en: new Date().toISOString()
      });
      console.log(`  ✅ ${item.producto} - Lote ${item.lote} (${item.cantidad_actual} unidades)`);
    }

    // 4. PRODUCCIÓN
    console.log('\n👨‍🍳 Cargando Producción...');
    for (const prod of datosProduccion) {
      const docRef = await addDoc(collection(db, 'produccion'), {
        ...prod,
        creado_en: new Date().toISOString()
      });
      console.log(`  ✅ ${prod.producto} - ${prod.cantidad} unidades (${prod.responsable})`);
    }

    // 5. CHECKLISTS
    console.log('\n✅ Cargando Checklists...');
    for (const checklist of datosChecklists) {
      const docRef = await addDoc(collection(db, 'checklists'), {
        ...checklist,
        creado_en: new Date().toISOString()
      });
      console.log(`  ✅ ${checklist.categoria} - ${checklist.turno} (${checklist.estado})`);
    }

    // 6. ALERTAS
    console.log('\n🚨 Cargando Alertas...');
    for (const alerta of datosAlertas) {
      const docRef = await addDoc(collection(db, 'alertas'), {
        ...alerta,
        creado_en: new Date().toISOString()
      });
      console.log(`  ✅ ${alerta.tipo} - ${alerta.mensaje}`);
    }

    console.log('\n\n🎉 ¡DATOS CARGADOS EXITOSAMENTE!');
    console.log('\n📊 Resumen:');
    console.log(`  • ${datosProveedores.length} Proveedores`);
    console.log(`  • ${datosProductos.length} Productos`);
    console.log(`  • ${datosInventario.length} Items de Inventario`);
    console.log(`  • ${datosProduccion.length} Registros de Producción`);
    console.log(`  • ${datosChecklists.length} Checklists`);
    console.log(`  • ${datosAlertas.length} Alertas`);
    console.log('\n✅ Puedes verificar en Firebase Console:');
    console.log('   https://console.firebase.google.com/project/control-de-cosina/firestore\n');

  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
  }
}

// Ejecutar
cargarDatosMuestra();
