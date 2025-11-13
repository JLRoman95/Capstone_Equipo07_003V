/**
 * Script para verificar y actualizar roles de usuarios en Firebase
 * Ejecutar con: node verificar-roles.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBT_VrXUzf4rryaAa8EZg5P2mXArrOv1Gc",
  authDomain: "control-de-cosina.firebaseapp.com",
  projectId: "control-de-cosina",
  storageBucket: "control-de-cosina.firebasestorage.app",
  messagingSenderId: "762293614982",
  appId: "1:762293614982:web:2d12e7e7f1d9e6f9f5c3f0",
  measurementId: "G-PM7E9BSHBY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verificarRoles() {
  console.log('🔍 Verificando roles de usuarios en Firestore...\n');
  
  try {
    const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
    
    if (usuariosSnapshot.empty) {
      console.log('⚠️  No se encontraron usuarios en Firestore');
      console.log('Asegúrate de que:');
      console.log('1. Has registrado al menos un usuario');
      console.log('2. Firestore está habilitado en Firebase Console');
      return;
    }
    
    console.log(`📊 Total de usuarios encontrados: ${usuariosSnapshot.size}\n`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      const rolIcon = data.rol === 'admin' ? '🔴' : data.rol === 'auditor' ? '🟡' : '🟢';
      
      console.log(`${rolIcon} Usuario: ${data.nombre}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Rol: ${data.rol || '❌ NO DEFINIDO'}`);
      console.log(`   Activo: ${data.activo ? 'Sí' : 'No'}`);
      console.log(`   ID: ${doc.id}`);
      console.log('───────────────────────────────────────────────────────\n');
    });
    
    // Verificar si hay usuarios sin rol
    const usuariosSinRol = [];
    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.rol) {
        usuariosSinRol.push({ id: doc.id, ...data });
      }
    });
    
    if (usuariosSinRol.length > 0) {
      console.log('⚠️  USUARIOS SIN ROL DEFINIDO:');
      usuariosSinRol.forEach(u => {
        console.log(`   - ${u.nombre} (${u.email})`);
      });
      console.log('\n💡 Estos usuarios recibirán el rol "cocinero" por defecto al iniciar sesión');
    } else {
      console.log('✅ Todos los usuarios tienen rol definido');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('\n📌 RESUMEN DE ROLES:');
    
    const resumen = {
      admin: 0,
      cocinero: 0,
      auditor: 0,
      sinRol: 0
    };
    
    usuariosSnapshot.forEach((doc) => {
      const rol = doc.data().rol;
      if (rol === 'admin') resumen.admin++;
      else if (rol === 'cocinero') resumen.cocinero++;
      else if (rol === 'auditor') resumen.auditor++;
      else resumen.sinRol++;
    });
    
    console.log(`   🔴 Administradores: ${resumen.admin}`);
    console.log(`   🟢 Cocineros: ${resumen.cocinero}`);
    console.log(`   🟡 Auditores: ${resumen.auditor}`);
    if (resumen.sinRol > 0) {
      console.log(`   ⚪ Sin rol: ${resumen.sinRol}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error al verificar roles:', error);
    console.error('Detalles:', error.message);
  }
  
  process.exit(0);
}

// Ejecutar
verificarRoles();
