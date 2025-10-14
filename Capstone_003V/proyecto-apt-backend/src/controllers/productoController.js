import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Crear producto
export const crearProducto = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nombre, codigo, categoria, unidad_medida, id_proveedor, stock_minimo = 0 } = req.body;

    // Verificar duplicado por nombre o código
    const exist = await pool.query(
      'SELECT * FROM productos WHERE nombre=$1 OR codigo=$2',
      [nombre, codigo]
    );
    if (exist.rows.length > 0) {
      return res.status(400).json({ error: 'Producto ya existe por nombre o código' });
    }

    const result = await pool.query(
      `INSERT INTO productos 
       (nombre, codigo, categoria, unidad_medida, id_proveedor, stock_actual, stock_minimo) 
       VALUES ($1, $2, $3, $4, $5, 0, $6) RETURNING *`,
      [nombre, codigo, categoria, unidad_medida, id_proveedor, stock_minimo]
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
      `SELECT p.*, pr.nombre AS proveedor_nombre, pr.contacto AS proveedor_contacto
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { nombre, codigo, categoria, unidad_medida, id_proveedor, stock_minimo } = req.body;

    const result = await pool.query(
      `UPDATE productos 
       SET nombre=$1, codigo=$2, categoria=$3, unidad_medida=$4, id_proveedor=$5, stock_minimo=$6
       WHERE id_producto=$7 RETURNING *`,
      [nombre, codigo, categoria, unidad_medida, id_proveedor, stock_minimo, id]
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

    // Antes de eliminar el producto, eliminar todos los lotes en inventario
    await pool.query('DELETE FROM inventario WHERE id_producto=$1', [id]);
    await pool.query('DELETE FROM productos WHERE id_producto=$1', [id]);

    res.status(200).json({ message: 'Producto y sus lotes eliminados' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};
