import { pool } from '../config/db.js';

// 🔹 Registrar una nueva producción con detalles
export const registrarProduccion = async (req, res) => {
  const client = await pool.connect();
  try {
    const { fecha, responsable, turno, registros } = req.body;

    if (!fecha || !responsable || !turno || !registros?.length) {
      return res.status(400).json({ message: 'Faltan datos en el formulario' });
    }

    await client.query('BEGIN');

    // 1️⃣ Insertar encabezado de producción
    const prodResult = await client.query(
      `INSERT INTO produccion_alimentos (fecha, responsable, turno)
       VALUES ($1, $2, $3) RETURNING id_produccion`,
      [fecha, responsable, turno]
    );
    const id_produccion = prodResult.rows[0].id_produccion;

    // 2️⃣ Insertar cada producto y actualizar inventario
    for (const reg of registros) {
      const { id_producto, cantidad, temp, hora, obs } = reg;

      // Validación simple por si falta cantidad o producto
      if (!id_producto || !cantidad) continue;

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
         ORDER BY fecha_ingreso ASC`,
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

      // Crear alerta si falta stock
      if (restante > 0) {
        await client.query(
          `INSERT INTO alertas (tipo, descripcion, id_referencia)
           VALUES ('stock_bajo', 'Stock insuficiente al registrar producción', $1)`,
          [id_producto]
        );
      }

      // Crear alerta si temperatura < 75°C
      if (temp && temp < 75) {
        await client.query(
          `INSERT INTO alertas (tipo, descripcion, id_referencia)
           VALUES ('temperatura', 'Temperatura de cocción insuficiente para producto', $1)`,
          [id_producto]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Producción registrada correctamente', id_produccion });
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
      SELECT p.*, d.id_detalle, pr.nombre AS producto, d.cantidad, d.temp_coccion, d.hora, d.observaciones
      FROM produccion_alimentos p
      JOIN produccion_detalle d ON p.id_produccion = d.id_produccion
      JOIN productos pr ON d.id_producto = pr.id_producto
      ORDER BY p.fecha DESC, p.id_produccion DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo producciones:', err);
    res.status(500).json({ message: 'Error al obtener registros de producción', error: err.message });
  }
};
