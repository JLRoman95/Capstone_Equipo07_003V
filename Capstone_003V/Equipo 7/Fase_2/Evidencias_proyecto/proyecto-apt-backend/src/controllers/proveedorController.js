import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Crear proveedor
export const crearProveedor = async (req, res) => {
  // Validación de Express Validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nombre, contacto, telefono, email } = req.body;
    const result = await pool.query(
      'INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, contacto, telefono, email]
    );
    res.status(201).json({ message: 'Proveedor creado', proveedor: result.rows[0] });
  } catch (err) {
    console.error(err);

    // Manejo de errores específicos de PostgreSQL
    if (err.code === '23505') { // UNIQUE
      return res.status(400).json({ error: 'Ya existe un proveedor con este email' });
    } else if (err.code === '23514') { // CHECK
      return res.status(400).json({ error: 'Datos inválidos: violación de constraints' });
    } else if (err.code === '23502') { // NOT NULL
      return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    // Error general
    res.status(500).json({ error: err.message });
  }
};

// Listar proveedores
export const listarProveedores = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proveedores ORDER BY id_proveedor');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar proveedores' });
  }
};
// Actualizar proveedor
export const actualizarProveedor = async (req, res) => {
  // Validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, email } = req.body;
    const result = await pool.query(
      'UPDATE proveedores SET nombre=$1, contacto=$2, telefono=$3, email=$4 WHERE id_proveedor=$5 RETURNING *',
      [nombre, contacto, telefono, email, id]
    );
    res.status(200).json({ message: 'Proveedor actualizado', proveedor: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

// Eliminar proveedor
export const eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM proveedores WHERE id_proveedor=$1', [id]);
    res.status(200).json({ message: 'Proveedor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};
