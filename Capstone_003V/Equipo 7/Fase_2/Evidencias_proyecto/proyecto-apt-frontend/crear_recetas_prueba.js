import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

// IDs reales de productos en Firestore
const PRODUCTOS = {
  LECHE: '0j0IECaNGW02e2XpIkKE',
  CARNE: '66o37sOffFcv16VkhrVv',
  CEBOLLA: 'A2nwjapZGrgyfAEbD8BS',
  ARROZ: 'Bi6JufIkz3oluf0j7LUk',
  PAN: 'Ee4SvD33Aj1LWv3mzRiI',
  TOMATE: 'GkUj6Bhzm9vVU0oQIHmu',
  LECHUGA: 'GnRjcrYLTComxnKoaXL6',
  POLLO: 'JYFUz2LKn6pvPB2XESzv',
  ACEITE: 'K6GQjSUaF00kUIE4kQQw',
  QUESO: 'UDgKh9Cd7ztqHRWi8pxM'
};

const recetasPrueba = [
  {
    nombre: "Hamburguesa Casera",
    descripcion: "Hamburguesa clásica con carne, queso, lechuga y tomate en pan marraqueta",
    ingredientes: [
      { codigo_producto: PRODUCTOS.CARNE, cantidad: 150 },     // 150g de carne molida
      { codigo_producto: PRODUCTOS.PAN, cantidad: 1 },         // 1 pan marraqueta
      { codigo_producto: PRODUCTOS.QUESO, cantidad: 30 },      // 30g de queso
      { codigo_producto: PRODUCTOS.LECHUGA, cantidad: 20 },    // 20g de lechuga
      { codigo_producto: PRODUCTOS.TOMATE, cantidad: 30 }      // 30g de tomate
    ],
    creado_en: new Date().toISOString()
  },
  {
    nombre: "Pollo al Horno",
    descripcion: "Pollo entero asado con aceite, cebolla y tomate",
    ingredientes: [
      { codigo_producto: PRODUCTOS.POLLO, cantidad: 200 },     // 200g de pollo
      { codigo_producto: PRODUCTOS.ACEITE, cantidad: 20 },     // 20ml de aceite
      { codigo_producto: PRODUCTOS.CEBOLLA, cantidad: 50 },    // 50g de cebolla
      { codigo_producto: PRODUCTOS.TOMATE, cantidad: 40 }      // 40g de tomate
    ],
    creado_en: new Date().toISOString()
  },
  {
    nombre: "Arroz con Pollo",
    descripcion: "Arroz cocido con pollo, cebolla y tomate",
    ingredientes: [
      { codigo_producto: PRODUCTOS.ARROZ, cantidad: 100 },     // 100g de arroz
      { codigo_producto: PRODUCTOS.POLLO, cantidad: 120 },     // 120g de pollo
      { codigo_producto: PRODUCTOS.CEBOLLA, cantidad: 30 },    // 30g de cebolla
      { codigo_producto: PRODUCTOS.TOMATE, cantidad: 40 },     // 40g de tomate
      { codigo_producto: PRODUCTOS.ACEITE, cantidad: 15 }      // 15ml de aceite
    ],
    creado_en: new Date().toISOString()
  },
  {
    nombre: "Ensalada Mixta",
    descripcion: "Ensalada fresca con lechuga, tomate, cebolla y queso",
    ingredientes: [
      { codigo_producto: PRODUCTOS.LECHUGA, cantidad: 100 },   // 100g de lechuga
      { codigo_producto: PRODUCTOS.TOMATE, cantidad: 60 },     // 60g de tomate
      { codigo_producto: PRODUCTOS.CEBOLLA, cantidad: 20 },    // 20g de cebolla
      { codigo_producto: PRODUCTOS.QUESO, cantidad: 40 },      // 40g de queso
      { codigo_producto: PRODUCTOS.ACEITE, cantidad: 10 }      // 10ml de aceite
    ],
    creado_en: new Date().toISOString()
  },
  {
    nombre: "Sándwich de Carne",
    descripcion: "Sándwich con carne molida, queso y tomate en pan marraqueta",
    ingredientes: [
      { codigo_producto: PRODUCTOS.PAN, cantidad: 1 },         // 1 pan
      { codigo_producto: PRODUCTOS.CARNE, cantidad: 100 },     // 100g de carne
      { codigo_producto: PRODUCTOS.QUESO, cantidad: 25 },      // 25g de queso
      { codigo_producto: PRODUCTOS.TOMATE, cantidad: 20 }      // 20g de tomate
    ],
    creado_en: new Date().toISOString()
  },
  {
    nombre: "Pollo con Arroz Blanco",
    descripcion: "Plato simple de pollo con arroz, cebolla y aceite",
    ingredientes: [
      { codigo_producto: PRODUCTOS.POLLO, cantidad: 180 },     // 180g de pollo
      { codigo_producto: PRODUCTOS.ARROZ, cantidad: 120 },     // 120g de arroz
      { codigo_producto: PRODUCTOS.CEBOLLA, cantidad: 25 },    // 25g de cebolla
      { codigo_producto: PRODUCTOS.ACEITE, cantidad: 15 }      // 15ml de aceite
    ],
    creado_en: new Date().toISOString()
  },
  {
    nombre: "Tostadas con Queso",
    descripcion: "Pan tostado con queso mantecoso derretido",
    ingredientes: [
      { codigo_producto: PRODUCTOS.PAN, cantidad: 2 },         // 2 panes
      { codigo_producto: PRODUCTOS.QUESO, cantidad: 50 }       // 50g de queso
    ],
    creado_en: new Date().toISOString()
  }
];

async function crearRecetas() {
  console.log('🍳 Iniciando creación de recetas de prueba...\n');
  
  try {
    for (const receta of recetasPrueba) {
      const docRef = await addDoc(collection(db, 'recetas'), receta);
      console.log(`✅ Receta creada: ${receta.nombre} (ID: ${docRef.id})`);
      console.log(`   Ingredientes: ${receta.ingredientes.length}`);
      console.log(`   Descripción: ${receta.descripcion}\n`);
    }
    
    console.log('🎉 ¡Todas las recetas fueron creadas exitosamente!');
    console.log(`📊 Total de recetas creadas: ${recetasPrueba.length}`);
    
  } catch (error) {
    console.error('❌ Error al crear recetas:', error);
  }
  
  process.exit(0);
}

crearRecetas();
