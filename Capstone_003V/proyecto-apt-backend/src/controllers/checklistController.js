import { pool } from '../config/db.js';

/**
 * Crear un checklist con ítems predefinidos desde checklist_template_items
 */
export const crearChecklist = async (req, res) => {
  try {
    const { fecha, turno, id_usuario } = req.body;

    // Insertar checklist en la tabla principal
    const result = await pool.query(
      `INSERT INTO checklists(fecha, turno, id_usuario, estado)
       VALUES ($1, $2, $3, 'pendiente') RETURNING *`,
      [fecha, turno, id_usuario]
    );
    const checklist = result.rows[0];

    // Traer ítems del template
    const itemsTemplate = await pool.query(
      'SELECT descripcion FROM checklist_template_items ORDER BY id_template_item'
    );

    // Insertar ítems asociados al checklist
    const items = [];
    for (const item of itemsTemplate.rows) {
      const r = await pool.query(
        `INSERT INTO checklist_items(id_checklist, descripcion, resultado)
         VALUES ($1, $2, 'na') RETURNING *`,
        [checklist.id_checklist, item.descripcion]
      );
      items.push(r.rows[0]);
    }

    checklist.items = items;
    res.status(201).json(checklist);

  } catch (err) {
    console.error('Error al crear checklist:', err);
    res.status(500).json({ error: 'Error al crear checklist' });
  }
};

/**
 * Listar todos los checklists
 */
export const listarChecklists = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.nombre as usuario_nombre 
       FROM checklists c
       JOIN usuarios u ON c.id_usuario = u.id_usuario
       ORDER BY c.fecha DESC, c.creado_en DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar checklists:', err);
    res.status(500).json({ error: 'Error al listar checklists' });
  }
};

/**
 * Listar los ítems de un checklist específico
 */
export const listarItemsChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM checklist_items WHERE id_checklist = $1 ORDER BY id_item`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar ítems del checklist:', err);
    res.status(500).json({ error: 'Error al listar ítems' });
  }
};

// Actualizar checklist e ítems
export const actualizarChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    // Actualizar cada ítem
    for (const item of items) {
      await pool.query(
        'UPDATE checklist_items SET resultado=$1, observacion=$2, actualizado_en=NOW() WHERE id_item=$3',
        [item.resultado || null, item.observacion || null, item.id_item]
      );
    }

    // Obtener todos los resultados actuales
    const r = await pool.query('SELECT resultado FROM checklist_items WHERE id_checklist = $1', [id]);
    const resultados = r.rows.map(r => r.resultado);

    let estado = 'pendiente';
    const totalItems = resultados.length;
    const itemsRellenos = resultados.filter(r => r !== null && r !== '').length;

    if (itemsRellenos === 0) {
      estado = 'pendiente';
    } else if (itemsRellenos < totalItems) {
      estado = 'incompleto';
    } else {
      estado = 'completo';
    }

    await pool.query('UPDATE checklists SET estado=$1, actualizado_en=NOW() WHERE id_checklist=$2', [estado, id]);

    res.json({ message: 'Checklist actualizado', estado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar checklist' });
  }
};
