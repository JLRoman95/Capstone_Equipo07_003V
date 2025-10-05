import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Crear movimiento de insumo
export const crearMovimiento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { id_producto, cantidad, tipo, id_usuario } = req.body;

    // Verificar stock si es salida
    if (tipo === 'salida') {
      const stockRes = await pool.query('SELECT stock_actual FROM inventario WHERE id_producto=$1', [id_producto]);
      if (!stockRes.rows[0]) return res.status(404).json({ error: 'Producto no encontrado en inventario' });
      if (stockRes.rows[0].stock_actual < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Insertar movimiento
    const resultMovimiento = await pool.query(
      'INSERT INTO movimientos_insumo (id_producto, cantidad, tipo, fecha, id_usuario) VALUES ($1, $2, $3, NOW(), $4) RETURNING *',
      [id_producto, cantidad, tipo, id_usuario]
    );

    // Actualizar inventario
    let operacion = tipo === 'salida' ? -cantidad : cantidad;
    await pool.query(
      'UPDATE inventario SET stock_actual = stock_actual + $1, fecha_actualizacion=NOW() WHERE id_producto=$2',
      [operacion, id_producto]
    );

    res.status(201).json({ message: 'Movimiento registrado', movimiento: resultMovimiento.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Listar movimientos
export const listarMovimientos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, p.nombre AS producto, u.nombre AS usuario
       FROM movimientos_insumo m
       JOIN productos p ON m.id_producto = p.id_producto
       JOIN usuarios u ON m.id_usuario = u.id_usuario
       ORDER BY m.id_movimiento DESC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
