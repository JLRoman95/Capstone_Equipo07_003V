import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// 📦 Listar inventario (lotes)
export const listarInventario = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, p.nombre AS producto, p.stock_minimo
       FROM inventario i 
       JOIN productos p ON i.id_producto = p.id_producto
       ORDER BY i.fecha_ingreso DESC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar inventario' });
  }
};

// 🧾 Crear inventario (nuevo lote)
export const crearInventario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const client = await pool.connect();
  try {
    const { id_producto, stock_actual, fecha_caducidad, id_usuario } = req.body;
    if (stock_actual <= 0) return res.status(400).json({ error: 'Stock debe ser mayor a 0' });

    await client.query('BEGIN');

    // 1️⃣ Insertar nuevo lote
    const result = await client.query(
      `INSERT INTO inventario (id_producto, stock_actual, fecha_caducidad, fecha_ingreso)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id_producto, stock_actual, fecha_caducidad]
    );

    // 2️⃣ Registrar movimiento
    await client.query(
      `INSERT INTO movimientos_insumo (id_producto, cantidad, tipo, fecha, id_usuario)
       VALUES ($1, $2, 'entrada', NOW(), $3)`,
      [id_producto, stock_actual, id_usuario]
    );

    // 3️⃣ Recalcular stock total del producto
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    const total_stock = totalRows[0].total_stock || 0;

    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [total_stock, id_producto]
    );

    // 4️⃣ Verificar alerta de stock bajo
    await verificarYActualizarAlertasStock(client, id_producto, total_stock, id_usuario);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Inventario creado', inventario: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// 🔄 Actualizar inventario
export const actualizarInventario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { stock_actual, fecha_caducidad, id_usuario } = req.body;

    await client.query('BEGIN');

    // 1️⃣ Obtener lote actual
    const { rows } = await client.query(
      'SELECT id_producto, stock_actual FROM inventario WHERE id_inventario=$1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Inventario no encontrado' });
    const lote = rows[0];

    const cantidadCambio = stock_actual - lote.stock_actual;

    // 2️⃣ Actualizar lote
    const result = await client.query(
      `UPDATE inventario 
       SET stock_actual=$1, fecha_caducidad=$2, fecha_actualizacion=NOW()
       WHERE id_inventario=$3
       RETURNING *`,
      [stock_actual, fecha_caducidad, id]
    );

    // 3️⃣ Registrar movimiento si cambia el stock
    if (cantidadCambio !== 0) {
      await client.query(
        `INSERT INTO movimientos_insumo (id_producto, cantidad, tipo, fecha, id_usuario)
         VALUES ($1, $2, $3, NOW(), $4)`,
        [
          lote.id_producto,
          Math.abs(cantidadCambio),
          cantidadCambio > 0 ? 'entrada' : 'salida',
          id_usuario
        ]
      );
    }

    // 4️⃣ Actualizar stock total
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [lote.id_producto]
    );
    const total_stock = totalRows[0].total_stock || 0;
    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [total_stock, lote.id_producto]
    );

    // 5️⃣ Revisar alertas de stock bajo
    await verificarYActualizarAlertasStock(client, lote.id_producto, total_stock, id_usuario);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Inventario actualizado', inventario: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// 🗑️ Eliminar inventario (lote)
export const eliminarInventario = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT id_producto, stock_actual FROM inventario WHERE id_inventario=$1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Inventario no encontrado' });

    const { id_producto } = rows[0];

    await client.query('DELETE FROM inventario WHERE id_inventario=$1', [id]);

    // Actualizar stock total
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    const total_stock = totalRows[0].total_stock || 0;

    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [total_stock, id_producto]
    );

    // Revisar alertas
    await verificarYActualizarAlertasStock(client, id_producto, total_stock, null);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Inventario eliminado' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

//
// 🧩 FUNCIÓN AUXILIAR PARA ALERTAS DE STOCK BAJO
//
const verificarYActualizarAlertasStock = async (client, id_producto, total_stock, id_usuario) => {
  // Obtener stock mínimo del producto
  const { rows: productoRows } = await client.query(
    'SELECT nombre, stock_minimo FROM productos WHERE id_producto=$1',
    [id_producto]
  );
  if (!productoRows.length) return;

  const { nombre, stock_minimo } = productoRows[0];

  // Si stock < mínimo → crear alerta
  if (stock_minimo && total_stock < stock_minimo) {
    await client.query(
      `INSERT INTO alertas (tipo, descripcion, id_referencia, id_usuario)
       VALUES ('stock_bajo', $1, $2, $3)`,
      [
        `El producto "${nombre}" tiene stock bajo (${total_stock}/${stock_minimo}).`,
        id_producto,
        id_usuario
      ]
    );
  } else {
    // Si ya estaba bajo y se recuperó → marcar resuelta
    await client.query(
      `UPDATE alertas 
       SET estado='resuelta'
       WHERE tipo='stock_bajo' AND id_referencia=$1 AND estado='pendiente'`,
      [id_producto]
    );
  }
};
