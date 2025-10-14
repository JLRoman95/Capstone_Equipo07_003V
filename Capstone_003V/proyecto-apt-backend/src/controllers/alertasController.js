// src/controllers/alertasController.js
import { pool } from '../config/db.js';

/**
 * Listar alertas
 * Query params (opcionales): tipo, estado, fecha_from, fecha_to
 */
export const listarAlertas = async (req, res) => {
  try {
    const { tipo, estado, fecha_from, fecha_to } = req.query;
    const conditions = [];
    const values = [];

    if (tipo) { values.push(tipo); conditions.push(`tipo = $${values.length}`); }
    if (estado) { values.push(estado); conditions.push(`estado = $${values.length}`); }
    if (fecha_from) { values.push(fecha_from); conditions.push(`fecha >= $${values.length}`); }
    if (fecha_to) { values.push(fecha_to); conditions.push(`fecha <= $${values.length}`); }

    let sql = `SELECT a.*, u.nombre AS nombre_usuario
               FROM alertas a
               LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario`;
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY fecha DESC`;

    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (err) {
    console.error('Error listarAlertas:', err);
    res.status(500).json({ error: 'Error al listar alertas' });
  }
};

/**
 * Crear alerta manual (o por otros procesos que llamen al endpoint)
 * Body: { tipo, descripcion, id_referencia, id_usuario }
 */
export const crearAlerta = async (req, res) => {
  try {
    const { tipo, descripcion, id_referencia, id_usuario } = req.body;
    if (!tipo || !descripcion) return res.status(400).json({ error: 'tipo y descripcion son requeridos' });

    const { rows } = await pool.query(
      `INSERT INTO alertas (tipo, descripcion, id_referencia, id_usuario)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [tipo, descripcion, id_referencia || null, id_usuario || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error crearAlerta:', err);
    res.status(500).json({ error: 'Error al crear alerta' });
  }
};

/**
 * Actualizar estado de una alerta (resolver / ignorar)
 * Body: { estado } // 'resuelta' | 'ignoradas' | 'pendiente'
 */
export const actualizarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!estado || !['pendiente','resuelta','ignoradas'].includes(estado)) {
      return res.status(400).json({ error: 'estado inválido' });
    }

    const { rows } = await pool.query(
      `UPDATE alertas SET estado=$1 WHERE id_alerta=$2 RETURNING *`,
      [estado, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error actualizarAlerta:', err);
    res.status(500).json({ error: 'Error al actualizar alerta' });
  }
};
