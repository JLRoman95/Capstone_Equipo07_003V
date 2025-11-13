import { pool } from '../config/db.js';

// 🔹 Registrar una nueva producción con detalles
export const registrarProduccion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { responsable, turno, registros } = req.body;
    const id_usuario = req.user.id; // Obtener del token
    
    // Establecer fecha automáticamente al momento actual
    const fechaActual = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (!responsable || !turno || !registros?.length) {
      return res.status(400).json({ message: 'Faltan datos en el formulario (responsable, turno, registros)' });
    }

    await client.query('BEGIN');

    // 1️⃣ Insertar encabezado de producción con fecha automática y hora_registro por defecto
    const prodResult = await client.query(
      `INSERT INTO produccion_alimentos (fecha, responsable, turno)
       VALUES ($1, $2, $3) RETURNING id_produccion`,
      [fechaActual, responsable, turno]
    );
    const id_produccion = prodResult.rows[0].id_produccion;

    const alertasStockInsuficiente = [];

    // 2️⃣ Insertar cada producto y actualizar inventario
    for (const reg of registros) {
      const { id_producto, cantidad, temp, hora, obs } = reg;

      // Validación simple por si falta cantidad o producto
      if (!id_producto || !cantidad) continue;

      // Verificar stock disponible antes de descontar
      const { rows: stockRows } = await client.query(
        'SELECT SUM(stock_actual) AS stock_disponible FROM inventario WHERE id_producto=$1',
        [id_producto]
      );
      const stockDisponible = stockRows[0].stock_disponible || 0;

      if (stockDisponible < cantidad) {
        alertasStockInsuficiente.push({
          id_producto,
          cantidad_requerida: cantidad,
          stock_disponible: stockDisponible,
          deficit: cantidad - stockDisponible
        });
      }

      // Insertar detalle de producción
      await client.query(
        `INSERT INTO produccion_detalle 
         (id_produccion, id_producto, cantidad, temp_coccion, hora, observaciones)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id_produccion, id_producto, cantidad, temp || null, hora || null, obs || null]
      );

      // Descontar stock del inventario usando FIFO
      const lotes = await client.query(
        `SELECT id_inventario, stock_actual
         FROM inventario
         WHERE id_producto = $1 AND stock_actual > 0
         ORDER BY fecha_caducidad ASC, fecha_ingreso ASC`,
        [id_producto]
      );

      let restante = Number(cantidad);
      for (const lote of lotes.rows) {
        if (restante <= 0) break;
        const usado = Math.min(lote.stock_actual, restante);
        await client.query(
          `UPDATE inventario SET stock_actual = stock_actual - $1 WHERE id_inventario = $2`,
          [usado, lote.id_inventario]
        );
        restante -= usado;
      }

      // Actualizar stock total del producto
      const { rows: totalRows } = await client.query(
        'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
        [id_producto]
      );
      const total_stock = totalRows[0].total_stock || 0;
      
      await client.query(
        'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
        [total_stock, id_producto]
      );

      // Las alertas de stock se generan automáticamente en tiempo real
    }

    // Crear alertas para stock insuficiente si las hay
    for (const alerta of alertasStockInsuficiente) {
      const { rows: productoRows } = await client.query(
        'SELECT nombre FROM productos WHERE id_producto=$1',
        [alerta.id_producto]
      );
      const nombreProducto = productoRows[0]?.nombre || `Producto ID ${alerta.id_producto}`;
      
      await client.query(
        `INSERT INTO alertas (tipo, descripcion, id_referencia, id_usuario)
         VALUES ('stock_insuficiente', $1, $2, $3)`,
        [
          `Stock insuficiente para ${nombreProducto}: se requieren ${alerta.cantidad_requerida} unidades pero solo hay ${alerta.stock_disponible}. Déficit: ${alerta.deficit} unidades`,
          alerta.id_producto,
          id_usuario
        ]
      );
    }

    await client.query('COMMIT');
    
    const response = { 
      message: 'Producción registrada correctamente', 
      id_produccion 
    };
    
    if (alertasStockInsuficiente.length > 0) {
      response.warnings = {
        stock_insuficiente: alertasStockInsuficiente,
        message: `Se generaron ${alertasStockInsuficiente.length} alertas de stock insuficiente`
      };
    }
    
    res.status(201).json(response);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error registrando producción:', err);
    res.status(500).json({ message: 'Error al registrar la producción', error: err.message });
  } finally {
    client.release();
  }
};

// 🔹 Obtener historial de producciones
export const listarProduccion = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, p.hora_registro, d.id_detalle, pr.nombre AS producto, d.cantidad, d.temp_coccion, d.hora, d.observaciones
      FROM produccion_alimentos p
      JOIN produccion_detalle d ON p.id_produccion = d.id_produccion
      JOIN productos pr ON d.id_producto = pr.id_producto
      ORDER BY p.fecha DESC, p.hora_registro DESC, p.id_produccion DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo producciones:', err);
    res.status(500).json({ message: 'Error al obtener registros de producción', error: err.message });
  }
};
