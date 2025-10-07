import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Listar inventario (lotes)
export const listarInventario = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, p.nombre AS producto 
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

// Crear inventario (nuevo lote)
export const crearInventario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const client = await pool.connect();
  try {
    const { id_producto, stock_actual, fecha_caducidad, id_usuario } = req.body;

    if (stock_actual <= 0) return res.status(400).json({ error: 'Stock debe ser mayor a 0' });

    await client.query('BEGIN');

    // Insertar nuevo lote
    const result = await client.query(
      `INSERT INTO inventario (id_producto, stock_actual, fecha_caducidad, fecha_ingreso)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id_producto, stock_actual, fecha_caducidad]
    );

    // Registrar movimiento de entrada automáticamente
    await client.query(
      `INSERT INTO movimientos_insumo 
         (id_producto, cantidad, tipo, fecha, id_usuario)
       VALUES ($1, $2, 'entrada', NOW(), $3)`,
      [id_producto, stock_actual, id_usuario]
    );

    // Actualizar stock total en productos sumando todos los lotes
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, id_producto]
    );

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

// Actualizar inventario (lote)
export const actualizarInventario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { stock_actual, fecha_caducidad, id_usuario } = req.body;

    await client.query('BEGIN');

    // Obtener lote actual
    const { rows } = await client.query(
      'SELECT id_producto, stock_actual FROM inventario WHERE id_inventario=$1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Inventario no encontrado' });
    const lote = rows[0];

    // Calcular diferencia de stock
    const cantidadCambio = stock_actual - lote.stock_actual;

    // Actualizar lote
    const result = await client.query(
      `UPDATE inventario 
       SET stock_actual=$1, fecha_caducidad=$2, fecha_actualizacion=NOW()
       WHERE id_inventario=$3
       RETURNING *`,
      [stock_actual, fecha_caducidad, id]
    );

    // Si se incrementa stock, registrar movimiento de entrada
    if (cantidadCambio > 0) {
      await client.query(
        `INSERT INTO movimientos_insumo
           (id_producto, cantidad, tipo, fecha, id_usuario)
         VALUES ($1, $2, 'entrada', NOW(), $3)`,
        [lote.id_producto, cantidadCambio, id_usuario]
      );
    }

    // Actualizar stock total en productos
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [lote.id_producto]
    );
    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, lote.id_producto]
    );

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

// Eliminar inventario (lote)
export const eliminarInventario = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Obtener lote antes de eliminar
    const { rows } = await client.query(
      'SELECT id_producto, stock_actual FROM inventario WHERE id_inventario=$1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Inventario no encontrado' });
    const id_producto = rows[0].id_producto;

    await client.query('DELETE FROM inventario WHERE id_inventario=$1', [id]);

    // Actualizar stock total en productos
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, id_producto]
    );

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
