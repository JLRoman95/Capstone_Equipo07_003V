// ===================================================
// SCRIPT PARA CREAR USUARIOS DE PRUEBA PARA SWAGGER
// ===================================================

import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'apt_db',
  password: '1234',
  port: 5432,
});

async function crearUsuariosPrueba() {
  console.log('🔧 CONFIGURANDO USUARIOS DE PRUEBA PARA SWAGGER...\n');
  
  try {
    // Usuarios de prueba con passwords hasheados
    const usuarios = [
      {
        nombre: 'Administrador APT',
        email: 'admin@apt.com',
        password: 'admin123',
        rol: 'admin'
      },
      {
        nombre: 'Cocinero Principal',
        email: 'cocinero@apt.com', 
        password: 'cocinero123',
        rol: 'cocinero'
      },
      {
        nombre: 'Auditor Jefe',
        email: 'auditor@apt.com',
        password: 'auditor123', 
        rol: 'auditor'
      }
    ];

    for (const usuario of usuarios) {
      console.log(`📝 Procesando: ${usuario.email}...`);
      
      // Verificar si ya existe
      const existeQuery = 'SELECT id_usuario, nombre FROM usuarios WHERE email = $1';
      const existeResult = await pool.query(existeQuery, [usuario.email]);
      
      // Hashear password
      const passwordHash = await bcrypt.hash(usuario.password, 10);
      
      if (existeResult.rows.length > 0) {
        // Actualizar usuario existente
        const updateQuery = `
          UPDATE usuarios 
          SET password_hash = $1, nombre = $2, activo = true
          WHERE email = $3
          RETURNING id_usuario, nombre, email, rol
        `;
        
        const result = await pool.query(updateQuery, [
          passwordHash,
          usuario.nombre,
          usuario.email
        ]);
        
        console.log(`   ✅ Actualizado ${usuario.email} (ID: ${result.rows[0].id_usuario})`);
      } else {
        // Crear usuario nuevo
        const insertQuery = `
          INSERT INTO usuarios (nombre, email, password_hash, rol, activo, creado_en)
          VALUES ($1, $2, $3, $4, true, NOW())
          RETURNING id_usuario, nombre, email, rol
        `;
        
        const result = await pool.query(insertQuery, [
          usuario.nombre,
          usuario.email, 
          passwordHash,
          usuario.rol
        ]);
        
        console.log(`   ✅ Creado ${usuario.email} (ID: ${result.rows[0].id_usuario})`);
      }
    }
    
    console.log('\n🎉 USUARIOS DE PRUEBA CONFIGURADOS EXITOSAMENTE!\n');
    
    // Mostrar información para Swagger
    console.log('📋 CREDENCIALES PARA SWAGGER UI:');
    console.log('================================');
    console.log('🔧 ADMIN (acceso completo):');
    console.log('   Email: admin@apt.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👨‍🍳 COCINERO (inventario/producción):');
    console.log('   Email: cocinero@apt.com');
    console.log('   Password: cocinero123');
    console.log('');
    console.log('📋 AUDITOR (auditoría/reportes):');
    console.log('   Email: auditor@apt.com');
    console.log('   Password: auditor123');
    console.log('');
    console.log('🌐 Swagger UI: http://localhost:4000/api-docs');
    console.log('');
    console.log('✅ LISTO PARA USAR SWAGGER CON AUTENTICACIÓN!');
    
  } catch (error) {
    console.error('❌ Error creando usuarios:', error.message);
  } finally {
    await pool.end();
  }
}

// Verificar usuarios existentes
async function verificarUsuarios() {
  try {
    const query = 'SELECT id_usuario, nombre, email, rol, activo FROM usuarios ORDER BY id_usuario';
    const result = await pool.query(query);
    
    console.log('\n👥 USUARIOS EN LA BASE DE DATOS:');
    console.log('==============================');
    
    if (result.rows.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return false;
    }
    
    result.rows.forEach(user => {
      console.log(`📧 ${user.email} | ${user.rol} | ${user.activo ? 'Activo' : 'Inactivo'}`);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verificando usuarios:', error.message);
    return false;
  }
}

// Ejecutar script
async function main() {
  console.log('🚀 INICIALIZANDO USUARIOS DE PRUEBA PARA SWAGGER...\n');
  
  await verificarUsuarios();
  await crearUsuariosPrueba();
}

main();