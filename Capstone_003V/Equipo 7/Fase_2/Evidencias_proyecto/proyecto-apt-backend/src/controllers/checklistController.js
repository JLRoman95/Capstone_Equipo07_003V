import { pool } from '../config/db.js';

/**
 * Crear un checklist con ítems predefinidos desde checklist_template_items
 */
export const crearChecklist = async (req, res) => {
  const client = await pool.connect();
  try {
    const { turno } = req.body;
    const id_usuario = req.user.id; // Obtener del token
    
    // Establecer fecha automáticamente al momento actual
    const fechaActual = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    if (!turno) {
      return res.status(400).json({ error: 'El turno es obligatorio' });
    }

    await client.query('BEGIN');

    // Insertar checklist en la tabla principal con fecha automática
    const result = await client.query(
      `INSERT INTO checklists(fecha, turno, id_usuario, estado)
       VALUES ($1, $2, $3, 'pendiente') RETURNING *`,
      [fechaActual, turno, id_usuario]
    );
    const checklist = result.rows[0];

    // Traer ítems del template
    const itemsTemplate = await client.query(
      'SELECT descripcion FROM checklist_template_items ORDER BY id_template_item'
    );

    // Insertar ítems asociados al checklist
    const items = [];
    for (const item of itemsTemplate.rows) {
      const r = await client.query(
        `INSERT INTO checklist_items(id_checklist, descripcion, resultado)
         VALUES ($1, $2, 'na') RETURNING *`,
        [checklist.id_checklist, item.descripcion]
      );
      items.push(r.rows[0]);
    }

    await client.query('COMMIT');

    checklist.items = items;
    res.status(201).json(checklist);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear checklist:', err);
    res.status(500).json({ error: 'Error al crear checklist', details: err.message });
  } finally {
    client.release();
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
       ORDER BY c.id_checklist DESC`
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
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { items } = req.body;

    await client.query('BEGIN');

    // Validar que los ítems con resultado 'no_ok' tengan observación
    for (const item of items) {
      if (item.resultado === 'no_ok' && (!item.observacion || item.observacion.trim() === '')) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Los ítems marcados como "No OK" requieren observación obligatoria',
          item_id: item.id_item 
        });
      }
    }

    // Actualizar cada ítem
    for (const item of items) {
      await client.query(
        'UPDATE checklist_items SET resultado=$1, observacion=$2, actualizado_en=NOW() WHERE id_item=$3',
        [item.resultado || null, item.observacion || null, item.id_item]
      );
    }

    // Obtener todos los resultados actuales
    const r = await client.query('SELECT resultado FROM checklist_items WHERE id_checklist = $1', [id]);
    const resultados = r.rows.map(r => r.resultado);

    let estado = 'pendiente';
    const totalItems = resultados.length;
    const itemsRellenos = resultados.filter(r => r !== null && r !== '' && r !== 'na').length;
    const itemsNoOk = resultados.filter(r => r === 'no_ok').length;

    if (itemsRellenos === 0) {
      estado = 'pendiente';
    } else {
      // Si hay al menos un ítem completado, consideramos el checklist como completo
      estado = 'completo';
      
      if (itemsNoOk > 0) {
        console.log(`⚠️ Checklist ID ${id} completado con ${itemsNoOk} items no conformes`);
      } else {
        console.log(`✅ Checklist ID ${id} completado exitosamente`);
      }
    }

    await client.query('UPDATE checklists SET estado=$1, actualizado_en=NOW() WHERE id_checklist=$2', [estado, id]);

    await client.query('COMMIT');
    res.json({ 
      message: 'Checklist actualizado', 
      estado,
      items_no_ok: itemsNoOk,
      total_items: totalItems
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar checklist' });
  } finally {
    client.release();
  }
};
