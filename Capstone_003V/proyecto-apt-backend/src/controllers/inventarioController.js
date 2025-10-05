import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Listar inventario
export const listarInventario = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, p.nombre AS producto 
       FROM inventario i 
       JOIN productos p ON i.id_producto = p.id_producto
       ORDER BY i.id_inventario`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar inventario' });
  }
};

// Crear inventario inicial
export const crearInventario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id_producto, stock_actual, stock_minimo, fecha_caducidad } = req.body;

    const result = await pool.query(
      'INSERT INTO inventario (id_producto, stock_actual, stock_minimo, fecha_caducidad) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_producto, stock_actual, stock_minimo, fecha_caducidad]
    );

    // Actualizar stock total del producto sumando todos los lotes
    const { rows: totalRows } = await pool.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    await pool.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, id_producto]
    );

    res.status(201).json({ message: 'Inventario creado', inventario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar inventario
export const actualizarInventario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const { stock_actual, stock_minimo, fecha_caducidad } = req.body;

    const { rows } = await pool.query('SELECT id_producto FROM inventario WHERE id_inventario=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Inventario no encontrado' });
    const id_producto = rows[0].id_producto;

    const result = await pool.query(
      'UPDATE inventario SET stock_actual=$1, stock_minimo=$2, fecha_caducidad=$3, fecha_actualizacion=NOW() WHERE id_inventario=$4 RETURNING *',
      [stock_actual, stock_minimo, fecha_caducidad, id]
    );

    const { rows: totalRows } = await pool.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    await pool.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, id_producto]
    );

    res.status(200).json({ message: 'Inventario actualizado', inventario: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar inventario
export const eliminarInventario = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query('SELECT id_producto FROM inventario WHERE id_inventario=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Inventario no encontrado' });
    const id_producto = rows[0].id_producto;

    await pool.query('DELETE FROM inventario WHERE id_inventario=$1', [id]);

    const { rows: totalRows } = await pool.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    await pool.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, id_producto]
    );

    res.status(200).json({ message: 'Inventario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
