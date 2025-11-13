import { pool } from '../config/db.js';

/**
 * Generar alertas automáticas en tiempo real basadas en el estado actual del sistema
 */
export const generarAlertasAutomaticas = async (req, res) => {
  try {
    console.log('🚀 Generando alertas automáticas en tiempo real...');
    
    const alertasGeneradas = [];

    // 1. ALERTAS DE STOCK BAJO
    const productosStockBajo = await pool.query(`
      SELECT p.id_producto, p.nombre, p.stock_actual, p.stock_minimo
      FROM productos p
      WHERE p.stock_minimo > 0 
      AND p.stock_actual < p.stock_minimo
      ORDER BY p.nombre
    `);

    productosStockBajo.rows.forEach(producto => {
      alertasGeneradas.push({
        tipo: 'stock_bajo',
        prioridad: 'alta',
        titulo: 'Stock Bajo',
        descripcion: `${producto.nombre} - Stock: ${producto.stock_actual}/${producto.stock_minimo}`,
        producto_nombre: producto.nombre,
        stock_actual: producto.stock_actual,
        stock_minimo: producto.stock_minimo,
        id_referencia: producto.id_producto,
        fecha_generacion: new Date()
      });
    });

    // 2. ALERTAS DE CADUCIDAD PRÓXIMA (próximos 3 días)
    const lotesProximosACaducar = await pool.query(`
      SELECT i.id_inventario, i.id_producto, i.fecha_caducidad, p.nombre as producto_nombre,
             i.stock_actual
      FROM inventario i
      JOIN productos p ON i.id_producto = p.id_producto
      WHERE i.fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
      AND i.stock_actual > 0
      ORDER BY i.fecha_caducidad ASC
    `);

    lotesProximosACaducar.rows.forEach(lote => {
      const fechaCaducidad = new Date(lote.fecha_caducidad);
      const hoy = new Date();
      const diasRestantes = Math.ceil((fechaCaducidad - hoy) / (1000 * 60 * 60 * 24));
      
      let prioridad = 'media';
      if (diasRestantes <= 1) prioridad = 'alta';
      if (diasRestantes <= 0) prioridad = 'critica';

      alertasGeneradas.push({
        tipo: 'caducidad',
        prioridad,
        titulo: 'Producto Próximo a Caducar',
        descripcion: `${lote.producto_nombre} caduca en ${diasRestantes} días (${lote.stock_actual} unidades)`,
        producto_nombre: lote.producto_nombre,
        numero_lote: null, // No disponible en esta tabla
        dias_restantes: diasRestantes,
        fecha_caducidad: lote.fecha_caducidad,
        stock_actual: lote.stock_actual,
        id_referencia: lote.id_inventario,
        fecha_generacion: new Date()
      });
    });

    // 3. ALERTAS DE PRODUCTOS CADUCADOS
    const productosVencidos = await pool.query(`
      SELECT i.id_inventario, i.id_producto, i.fecha_caducidad, p.nombre as producto_nombre,
             i.stock_actual
      FROM inventario i
      JOIN productos p ON i.id_producto = p.id_producto
      WHERE i.fecha_caducidad < CURRENT_DATE
      AND i.stock_actual > 0
      ORDER BY i.fecha_caducidad ASC
    `);

    productosVencidos.rows.forEach(lote => {
      alertasGeneradas.push({
        tipo: 'producto_vencido',
        prioridad: 'critica',
        titulo: 'Producto Vencido',
        descripcion: `${lote.producto_nombre} está vencido desde ${new Date(lote.fecha_caducidad).toLocaleDateString('es-ES')} (${lote.stock_actual} unidades)`,
        producto_nombre: lote.producto_nombre,
        numero_lote: null, // No disponible en esta tabla
        fecha_caducidad: lote.fecha_caducidad,
        stock_actual: lote.stock_actual,
        id_referencia: lote.id_inventario,
        fecha_generacion: new Date()
      });
    });

    // 4. ALERTAS DE STOCK CRÍTICO (stock = 0)
    const productosSinStock = await pool.query(`
      SELECT p.id_producto, p.nombre
      FROM productos p
      WHERE p.stock_actual = 0
      ORDER BY p.nombre
    `);

    productosSinStock.rows.forEach(producto => {
      alertasGeneradas.push({
        tipo: 'stock_critico',
        prioridad: 'critica',
        titulo: 'Stock Agotado',
        descripcion: `${producto.nombre} - Sin stock disponible`,
        producto_nombre: producto.nombre,
        stock_actual: 0,
        id_referencia: producto.id_producto,
        fecha_generacion: new Date()
      });
    });

    console.log(`✅ Generadas ${alertasGeneradas.length} alertas automáticas`);

    // Ordenar por prioridad (crítica > alta > media > baja)
    const prioridadOrden = { 'critica': 1, 'alta': 2, 'media': 3, 'baja': 4 };
    alertasGeneradas.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);

    res.json({
      alertas: alertasGeneradas,
      resumen: {
        total: alertasGeneradas.length,
        stock_bajo: alertasGeneradas.filter(a => a.tipo === 'stock_bajo').length,
        caducidad: alertasGeneradas.filter(a => a.tipo === 'caducidad').length,
        vencidos: alertasGeneradas.filter(a => a.tipo === 'producto_vencido').length,
        sin_stock: alertasGeneradas.filter(a => a.tipo === 'stock_critico').length
      }
    });

  } catch (err) {
    console.error('Error generando alertas automáticas:', err);
    res.status(500).json({ error: 'Error al generar alertas automáticas' });
  }
};

/**
 * Obtener solo el conteo de alertas para mostrar en el dashboard
 */
export const contarAlertas = async (req, res) => {
  try {
    // Stock bajo
    const stockBajo = await pool.query(`
      SELECT COUNT(*) as count
      FROM productos p
      WHERE p.stock_minimo > 0 
      AND p.stock_actual < p.stock_minimo
    `);

    // Caducidad próxima
    const caducidad = await pool.query(`
      SELECT COUNT(*) as count
      FROM inventario i
      WHERE i.fecha_caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
      AND i.stock_actual > 0
    `);

    // Productos vencidos
    const vencidos = await pool.query(`
      SELECT COUNT(*) as count
      FROM inventario i
      WHERE i.fecha_caducidad < CURRENT_DATE
      AND i.stock_actual > 0
    `);

    // Stock crítico (agotado)
    const sinStock = await pool.query(`
      SELECT COUNT(*) as count
      FROM productos p
      WHERE p.stock_actual = 0
    `);

    const conteos = {
      stock_bajo: parseInt(stockBajo.rows[0].count),
      caducidad: parseInt(caducidad.rows[0].count),
      vencidos: parseInt(vencidos.rows[0].count),
      sin_stock: parseInt(sinStock.rows[0].count)
    };

    conteos.total = conteos.stock_bajo + conteos.caducidad + conteos.vencidos + conteos.sin_stock;

    res.json(conteos);
  } catch (err) {
    console.error('Error contando alertas:', err);
    res.status(500).json({ error: 'Error al contar alertas' });
  }
};