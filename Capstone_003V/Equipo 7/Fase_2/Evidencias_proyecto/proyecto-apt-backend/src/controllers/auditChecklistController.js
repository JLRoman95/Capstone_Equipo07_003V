// controllers/auditChecklistController.js
import { pool } from '../config/db.js';

/**
 * Revisar checklist por parte del auditor
 */
export const revisarChecklist = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { estado_revision, observaciones_auditor } = req.body;
    const id_usuario = req.user.id;

    // Validar estado
    if (!['aprobado', 'rechazado', 'pendiente_correccion'].includes(estado_revision)) {
      return res.status(400).json({ 
        error: 'Estado de revisión no válido',
        estados_validos: ['aprobado', 'rechazado', 'pendiente_correccion']
      });
    }

    await client.query('BEGIN');

    // Obtener checklist actual
    const checklistResult = await client.query(
      'SELECT * FROM checklists WHERE id_checklist = $1',
      [id]
    );

    if (!checklistResult.rows.length) {
      return res.status(404).json({ error: 'Checklist no encontrado' });
    }

    const checklistAnterior = checklistResult.rows[0];

    // Actualizar checklist con revisión
    const result = await client.query(
      `UPDATE checklists 
       SET estado = $1, 
           observaciones = $2, 
           actualizado_en = NOW()
       WHERE id_checklist = $3 
       RETURNING *`,
      [estado_revision === 'aprobado' ? 'completo' : 'pendiente', 
       observaciones_auditor || checklistAnterior.observaciones, 
       id]
    );

    await client.query('COMMIT');

    console.log(`✅ Checklist ${id} ${estado_revision} por auditor ${id_usuario}`);

    res.json({
      success: true,
      message: `Checklist ${estado_revision} correctamente`,
      checklist: result.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error revisando checklist:', err);
    res.status(500).json({ error: 'Error interno al revisar checklist' });
  } finally {
    client.release();
  }
};

/**
 * Obtener checklists pendientes de auditoría
 */
export const checklistsPendientesAuditoria = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.nombre as responsable_nombre
       FROM checklists c
       LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
       WHERE c.estado = 'completo'
       ORDER BY c.fecha DESC, c.creado_en DESC`
    );

    res.json({
      success: true,
      checklists_pendientes: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error obteniendo checklists pendientes:', err);
    res.status(500).json({ error: 'Error al obtener checklists pendientes' });
  }
};

/**
 * Estadísticas de auditoría de checklists
 */
export const estadisticasAuditoria = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    let whereClause = '';
    let params = [];

    if (fecha_desde && fecha_hasta) {
      whereClause = 'WHERE c.fecha BETWEEN $1 AND $2';
      params = [fecha_desde, fecha_hasta];
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_checklists,
        COUNT(CASE WHEN estado = 'completo' THEN 1 END) as completos,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
        ROUND(
          COUNT(CASE WHEN estado = 'completo' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(*), 0), 
          2
        ) as porcentaje_completado
      FROM checklists c
      ${whereClause}
    `, params);

    res.json({
      success: true,
      estadisticas: result.rows[0],
      periodo: { fecha_desde, fecha_hasta }
    });

  } catch (err) {
    console.error('Error obteniendo estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas de auditoría' });
  }
};