import { pool } from '../config/db.js';
import { validationResult } from 'express-validator';

// Crear movimiento de insumo con FIFO
export const crearMovimiento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const client = await pool.connect();

  try {
    const { id_producto, cantidad, tipo, id_usuario } = req.body;

    // Validaciones básicas
    if (!['entrada', 'salida', 'ajuste'].includes(tipo))
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    if (cantidad <= 0)
      return res.status(400).json({ error: 'Cantidad debe ser mayor a 0' });

    // Verificar existencia del producto
    const productoRes = await client.query(
      'SELECT * FROM productos WHERE id_producto=$1',
      [id_producto]
    );
    if (!productoRes.rows.length)
      return res.status(404).json({ error: 'Producto no encontrado' });

    // Iniciar transacción
    await client.query('BEGIN');

    if (tipo === 'salida') {
      // FIFO: obtener lotes por fecha_ingreso ascendente
      const lotesRes = await client.query(
        'SELECT * FROM inventario WHERE id_producto=$1 AND stock_actual>0 ORDER BY fecha_ingreso ASC',
        [id_producto]
      );
      const lotes = lotesRes.rows;
      let cantidadRestante = cantidad;

      if (lotes.reduce((acc, l) => acc + Number(l.stock_actual), 0) < cantidad)
        throw new Error('Stock insuficiente');

      // Iterar sobre los lotes hasta cubrir la cantidad
      for (const lote of lotes) {
        if (cantidadRestante <= 0) break;

        const descuento = Math.min(lote.stock_actual, cantidadRestante);

        // Registrar movimiento por lote
        await client.query(
          'INSERT INTO movimientos_insumo (id_producto, cantidad, tipo, fecha, id_usuario) VALUES ($1, $2, $3, NOW(), $4)',
          [id_producto, descuento, tipo, id_usuario]
        );

        // Actualizar stock del lote
        await client.query(
          'UPDATE inventario SET stock_actual = stock_actual - $1, fecha_actualizacion=NOW() WHERE id_inventario=$2',
          [descuento, lote.id_inventario]
        );

        cantidadRestante -= descuento;
      }
    } else {
      // Entrada o ajuste: agregamos a un solo lote nuevo
      const resultMovimiento = await client.query(
        'INSERT INTO movimientos_insumo (id_producto, cantidad, tipo, fecha, id_usuario) VALUES ($1, $2, $3, NOW(), $4) RETURNING *',
        [id_producto, cantidad, tipo, id_usuario]
      );

      // Actualizar inventario: se podría crear un nuevo lote si quieres
      await client.query(
        'UPDATE inventario SET stock_actual = stock_actual + $1, fecha_actualizacion=NOW() WHERE id_producto=$2',
        [cantidad, id_producto]
      );
    }

    // Recalcular stock total en productos
    const { rows: totalRows } = await client.query(
      'SELECT SUM(stock_actual) AS total_stock FROM inventario WHERE id_producto=$1',
      [id_producto]
    );
    await client.query(
      'UPDATE productos SET stock_actual=$1 WHERE id_producto=$2',
      [totalRows[0].total_stock || 0, id_producto]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Movimiento registrado usando FIFO',
      stock_actual_producto: totalRows[0].total_stock || 0
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Listar movimientos sigue igual
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
