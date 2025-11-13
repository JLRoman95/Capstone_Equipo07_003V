/**
 * Script de inicialización de datos para producción
 * Se ejecuta automáticamente en el primer despliegue
 * Solo carga datos si las colecciones están vacías
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBT_VrXUzf4rryaAa8EZg5P2mXArrOv1Gc",
  authDomain: "control-de-cosina.firebaseapp.com",
  projectId: "control-de-cosina",
  storageBucket: "control-de-cosina.firebasestorage.app",
  messagingSenderId: "762293614982",
  appId: "1:762293614982:web:2d12e7e7f1d9e6f9f5c3f0",
  measurementId: "G-PM7E9BSHBY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para verificar si una colección está vacía
async function isCollectionEmpty(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.empty;
}

// Datos de muestra
const DATOS_MUESTRA = {
  proveedores: [
    {
      nombre: "Distribuidora Alimentos S.A.",
      contacto: "Carlos Mendoza",
      telefono: "+56 9 8765 4321",
      email: "ventas@distalimentos.cl",
      direccion: "Av. Industrial 1234, Santiago"
    },
    {
      nombre: "Carnes Premium Ltda.",
      contacto: "María González",
      telefono: "+56 9 7654 3210",
      email: "contacto@carnespremium.cl",
      direccion: "Camino El Rosal 567, Puente Alto"
    },
    {
      nombre: "Verduras Frescas del Sur",
      contacto: "Jorge Ramírez",
      telefono: "+56 9 6543 2109",
      email: "ventas@verdurassur.cl",
      direccion: "Ruta 5 Sur Km 234, Talca"
    },
    {
      nombre: "Lácteos del Valle",
      contacto: "Patricia Flores",
      telefono: "+56 9 5432 1098",
      email: "info@lacteosvalley.cl",
      direccion: "Los Aromos 890, Osorno"
    },
    {
      nombre: "Panadería El Trigal",
      contacto: "Luis Soto",
      telefono: "+56 9 4321 0987",
      email: "pedidos@eltrigal.cl",
      direccion: "Calle Central 456, Rancagua"
    }
  ],

  productos: [
    { codigo_producto: "ARR001", nombre: "Arroz", categoria: "Granos", unidad_medida: "kg", precio_unitario: 1200 },
    { codigo_producto: "POL001", nombre: "Pollo", categoria: "Carnes", unidad_medida: "kg", precio_unitario: 3500 },
    { codigo_producto: "CAR001", nombre: "Carne Molida", categoria: "Carnes", unidad_medida: "kg", precio_unitario: 4800 },
    { codigo_producto: "VER001", nombre: "Lechuga", categoria: "Verduras", unidad_medida: "unidades", precio_unitario: 800 },
    { codigo_producto: "VER002", nombre: "Tomate", categoria: "Verduras", unidad_medida: "kg", precio_unitario: 1500 },
    { codigo_producto: "VER003", nombre: "Cebolla", categoria: "Verduras", unidad_medida: "kg", precio_unitario: 900 },
    { codigo_producto: "LAC001", nombre: "Leche", categoria: "Lacteos", unidad_medida: "litros", precio_unitario: 1100 },
    { codigo_producto: "LAC002", nombre: "Queso", categoria: "Lacteos", unidad_medida: "kg", precio_unitario: 5500 },
    { codigo_producto: "PAN001", nombre: "Pan", categoria: "Panaderia", unidad_medida: "unidades", precio_unitario: 1500 },
    { codigo_producto: "ACE001", nombre: "Aceite", categoria: "Aceites", unidad_medida: "litros", precio_unitario: 3200 }
  ],

  inventario: [
    { codigo_producto: "ARR001", lote: "L20241101", cantidad_unidades: 50, fecha_ingreso: "2024-11-01", fecha_vencimiento: "2025-11-01", estado: "disponible" },
    { codigo_producto: "POL001", lote: "L20241110", cantidad_unidades: 80, fecha_ingreso: "2024-11-10", fecha_vencimiento: "2024-11-17", estado: "disponible" },
    { codigo_producto: "CAR001", lote: "L20241108", cantidad_unidades: 60, fecha_ingreso: "2024-11-08", fecha_vencimiento: "2024-11-15", estado: "disponible" },
    { codigo_producto: "VER001", lote: "L20241112", cantidad_unidades: 45, fecha_ingreso: "2024-11-12", fecha_vencimiento: "2024-11-19", estado: "disponible" },
    { codigo_producto: "VER002", lote: "L20241111", cantidad_unidades: 70, fecha_ingreso: "2024-11-11", fecha_vencimiento: "2024-11-18", estado: "disponible" },
    { codigo_producto: "LAC001", lote: "L20241103", cantidad_unidades: 120, fecha_ingreso: "2024-11-03", fecha_vencimiento: "2024-11-13", estado: "disponible" },
    { codigo_producto: "LAC002", lote: "L20241104", cantidad_unidades: 30, fecha_ingreso: "2024-11-04", fecha_vencimiento: "2024-11-14", estado: "disponible" },
    { codigo_producto: "PAN001", lote: "L20241113", cantidad_unidades: 300, fecha_ingreso: "2024-11-13", fecha_vencimiento: "2024-11-15", estado: "disponible" }
  ],

  produccion: [
    { fecha: "2024-11-11", responsable: "Jorge González", turno: "Mañana", plato: "Cazuela de Vacuno", cantidad: 80 },
    { fecha: "2024-11-11", responsable: "María López", turno: "Tarde", plato: "Pastel de Choclo", cantidad: 100 },
    { fecha: "2024-11-12", responsable: "Pedro Soto", turno: "Mañana", plato: "Empanadas de Pino", cantidad: 150 },
    { fecha: "2024-11-12", responsable: "Ana Ramírez", turno: "Tarde", plato: "Charquicán", cantidad: 60 },
    { fecha: "2024-11-13", responsable: "Jorge González", turno: "Mañana", plato: "Porotos con Rienda", cantidad: 120 }
  ],

  checklists: [
    {
      fecha: "2024-11-13",
      turno: "Mañana",
      responsable: "Carlos Muñoz",
      estado: "completo",
      items: [
        { tarea: "Limpieza de superficies", completado: true },
        { tarea: "Verificación de temperaturas", completado: true },
        { tarea: "Control de higiene personal", completado: true }
      ]
    },
    {
      fecha: "2024-11-13",
      turno: "Tarde",
      responsable: "María González",
      estado: "completo",
      items: [
        { tarea: "Limpieza de superficies", completado: true },
        { tarea: "Verificación de temperaturas", completado: true },
        { tarea: "Control de higiene personal", completado: true }
      ]
    },
    {
      fecha: "2024-11-13",
      turno: "Noche",
      responsable: "Pedro Soto",
      estado: "pendiente",
      items: [
        { tarea: "Limpieza de superficies", completado: true },
        { tarea: "Verificación de temperaturas", completado: false },
        { tarea: "Control de higiene personal", completado: false }
      ]
    }
  ],

  alertas: [
    {
      tipo: "stock_bajo",
      titulo: "Stock Bajo: Tomate",
      descripcion: "El stock de Tomate (VER002) está por debajo del mínimo requerido",
      prioridad: "alta",
      estado: "activa",
      fecha: new Date().toISOString()
    },
    {
      tipo: "proximo_vencer",
      titulo: "Producto Próximo a Vencer: Leche",
      descripcion: "Lote L20241103 de Leche vence el 13/11/2024",
      prioridad: "alta",
      estado: "activa",
      fecha: new Date().toISOString()
    },
    {
      tipo: "proximo_vencer",
      titulo: "Producto Próximo a Vencer: Queso",
      descripcion: "Lote L20241104 de Queso vence el 14/11/2024",
      prioridad: "media",
      estado: "activa",
      fecha: new Date().toISOString()
    },
    {
      tipo: "checklist_pendiente",
      titulo: "Checklist Pendiente: Turno Noche",
      descripcion: "Checklist del turno Noche tiene tareas sin completar",
      prioridad: "media",
      estado: "activa",
      fecha: new Date().toISOString()
    }
  ]
};

async function inicializarDatos() {
  console.log('\n🚀 Iniciando carga de datos de muestra...\n');
  
  let datosYaCargados = false;
  
  try {
    // Verificar qué colecciones necesitan datos
    const colecciones = ['proveedores', 'productos', 'inventario', 'produccion', 'checklists', 'alertas'];
    
    for (const coleccion of colecciones) {
      const estaVacia = await isCollectionEmpty(coleccion);
      
      if (!estaVacia) {
        console.log(`⏭️  ${coleccion}: Ya contiene datos, omitiendo...`);
        datosYaCargados = true;
        continue;
      }
      
      console.log(`📦 Cargando ${coleccion}...`);
      const datos = DATOS_MUESTRA[coleccion];
      
      for (const item of datos) {
        await addDoc(collection(db, coleccion), {
          ...item,
          creado_en: serverTimestamp()
        });
      }
      
      console.log(`✅ ${datos.length} registros cargados en ${coleccion}`);
    }
    
    if (datosYaCargados) {
      console.log('\n✨ Algunas colecciones ya tenían datos. Solo se cargaron las vacías.\n');
    } else {
      console.log('\n🎉 ¡Datos de muestra cargados exitosamente!\n');
      console.log('📊 Resumen:');
      console.log(`   • ${DATOS_MUESTRA.proveedores.length} Proveedores`);
      console.log(`   • ${DATOS_MUESTRA.productos.length} Productos`);
      console.log(`   • ${DATOS_MUESTRA.inventario.length} Items de Inventario`);
      console.log(`   • ${DATOS_MUESTRA.produccion.length} Registros de Producción`);
      console.log(`   • ${DATOS_MUESTRA.checklists.length} Checklists`);
      console.log(`   • ${DATOS_MUESTRA.alertas.length} Alertas\n`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
    process.exit(1);
  }
}

// Ejecutar directamente
inicializarDatos();

export { isCollectionEmpty };
