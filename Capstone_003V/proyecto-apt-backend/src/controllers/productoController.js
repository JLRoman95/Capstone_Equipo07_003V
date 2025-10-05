import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Crear producto
export const crearProducto = async (req, res) => {
    // Validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

  try {
    const { nombre, codigo, categoria, unidad_medida, id_proveedor } = req.body;

    // Verificar duplicado por nombre o código
    const exist = await pool.query(
      'SELECT * FROM productos WHERE nombre=$1 OR codigo=$2',
      [nombre, codigo]
    );
    if (exist.rows.length > 0) {
      return res.status(400).json({ error: 'Producto ya existe por nombre o código' });
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, codigo, categoria, unidad_medida, id_proveedor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, codigo, categoria, unidad_medida, id_proveedor]
    );

    res.status(201).json({ message: 'Producto creado', producto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Listar productos
export const listarProductos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pr.nombre AS proveedor_nombre
       FROM productos p
       LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
       ORDER BY p.id_producto`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar productos' });
  }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
    // Validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

  try {
    const { id } = req.params;
    const { nombre, codigo, categoria, unidad_medida, id_proveedor } = req.body;

    const result = await pool.query(
      'UPDATE productos SET nombre=$1, codigo=$2, categoria=$3, unidad_medida=$4, id_proveedor=$5 WHERE id_producto=$6 RETURNING *',
      [nombre, codigo, categoria, unidad_medida, id_proveedor, id]
    );

    res.status(200).json({ message: 'Producto actualizado', producto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Eliminar producto
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM productos WHERE id_producto=$1', [id]);
    res.status(200).json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};
