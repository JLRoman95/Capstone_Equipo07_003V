import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// 📦 Listar inventario (lotes) - Ordenado por FIFO (First In, First Out)
export const listarInventario = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, p.nombre AS producto, p.stock_minimo, p.categoria, p.unidad_medida
       FROM inventario i 
       JOIN productos p ON i.id_producto = p.id_producto
       ORDER BY i.fecha_ingreso ASC, i.fecha_caducidad ASC`
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
    const { id_producto, stock_actual, fecha_caducidad } = req.body;
    const id_usuario = req.user.id; // Obtener del token
    if (stock_actual <= 0) return res.status(400).json({ error: 'Stock debe ser mayor a 0' });

    await client.query('BEGIN');

    // 1️⃣ Insertar nuevo lote
    const result = await client.query(
      `INSERT INTO inventario (id_producto, stock_actual, fecha_caducidad, fecha_ingreso)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id_producto, stock_actual, fecha_caducidad]
    );

    // 2️⃣ Recalcular stock total del producto
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    const total_stock = totalRows[0].total_stock || 0;

    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [total_stock, id_producto]
    );

    // Las alertas ahora se generan automáticamente en tiempo real

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
    const { stock_actual, fecha_caducidad } = req.body;
    const id_usuario = req.user.id; // Obtener del token

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

    // 3️⃣ Actualizar stock total
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [lote.id_producto]
    );
    const total_stock = totalRows[0].total_stock || 0;
    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [total_stock, lote.id_producto]
    );

    // Las alertas ahora se generan automáticamente en tiempo real

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
    const id_usuario = req.user?.id;

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

    // Las alertas ahora se generan automáticamente en tiempo real

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

// La función verificarYActualizarAlertasStock ha sido movida a alertasController.js como verificarStockBajo()

// 📋 Obtener inventario por FIFO para un producto específico
export const obtenerInventarioFIFO = async (req, res) => {
  try {
    const { id_producto } = req.params;
    
    const result = await pool.query(
      `SELECT i.*, p.nombre AS producto, p.unidad_medida
       FROM inventario i 
       JOIN productos p ON i.id_producto = p.id_producto
       WHERE i.id_producto = $1 AND i.stock_actual > 0
       ORDER BY i.fecha_ingreso ASC, i.fecha_caducidad ASC`,
      [id_producto]
    );
    
    res.status(200).json({
      producto_id: id_producto,
      lotes_disponibles: result.rows,
      total_lotes: result.rows.length,
      stock_total: result.rows.reduce((sum, lote) => sum + parseFloat(lote.stock_actual), 0)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inventario FIFO' });
  }
};

// 📦 Obtener próximo lote a usar (FIFO)
export const obtenerProximoLoteFIFO = async (req, res) => {
  try {
    const { id_producto } = req.params;
    
    const result = await pool.query(
      `SELECT i.*, p.nombre AS producto, p.unidad_medida
       FROM inventario i 
       JOIN productos p ON i.id_producto = p.id_producto
       WHERE i.id_producto = $1 AND i.stock_actual > 0
       ORDER BY i.fecha_ingreso ASC, i.fecha_caducidad ASC
       LIMIT 1`,
      [id_producto]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No hay stock disponible para este producto' });
    }
    
    const lote = result.rows[0];
    const diasEnInventario = Math.floor(
      (new Date() - new Date(lote.fecha_ingreso)) / (1000 * 60 * 60 * 24)
    );
    
    res.status(200).json({
      ...lote,
      dias_en_inventario: diasEnInventario,
      prioridad: 'USAR PRIMERO - FIFO'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener próximo lote FIFO' });
  }
};
