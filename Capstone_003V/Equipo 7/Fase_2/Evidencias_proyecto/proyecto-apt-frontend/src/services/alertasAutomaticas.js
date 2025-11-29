/**
 * Servicio para generar alertas automáticas basadas en el estado del inventario
 * Detecta: stock bajo, productos próximos a vencer, productos vencidos, stock crítico
 */

import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Genera alertas automáticas revisando el inventario
 * @returns {Object} Resumen de alertas generadas
 */
export const generarAlertasAutomaticas = async () => {
  try {
    console.log('🔍 Iniciando generación de alertas automáticas...');
    
    // Obtener inventario completo
    const inventarioSnapshot = await getDocs(collection(db, 'inventario'));
    const inventario = inventarioSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Obtener productos para obtener stock_minimo
    const productosSnapshot = await getDocs(collection(db, 'productos'));
    const productos = {};
    productosSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.codigo_producto) {
        // Usar codigo_producto como clave principal
        productos[data.codigo_producto] = {
          codigo: data.codigo_producto,
          nombre: data.nombre,
          stock_minimo: data.stock_minimo || 10,
          categoria: data.categoria
        };
      }
    });

    // Obtener alertas existentes para evitar duplicados
    const alertasSnapshot = await getDocs(
      query(collection(db, 'alertas'), where('estado', '==', 'activa'))
    );
    const alertasExistentes = new Set();
    alertasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Usar codigo_producto para deduplicación
      const key = data.metadata?.lote
        ? `${data.tipo}_${data.metadata?.codigo_producto}_${data.metadata?.lote}`
        : `${data.tipo}_${data.metadata?.codigo_producto}`;
      alertasExistentes.add(key);
    });

    // Obtener checklists pendientes
    const checklistsSnapshot = await getDocs(collection(db, 'checklists'));
    const checklists = checklistsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const alertasGeneradas = {
      stock_bajo: 0,
      caducidad: 0,
      producto_vencido: 0,
      stock_critico: 0,
      checklist_pendiente: 0,
      total: 0
    };

    const ahora = new Date();
    const sieteDelasDelante = new Date();
    sieteDelasDelante.setDate(sieteDelasDelante.getDate() + 7);

    const toDate = (valor) => {
      if (!valor) return null;
      if (typeof valor?.toDate === 'function') {
        const parsed = valor.toDate();
        return isNaN(parsed) ? null : parsed;
      }
      const parsed = new Date(valor);
      return isNaN(parsed) ? null : parsed;
    };

    // Calcular totales por producto para stock bajo/critico
    const totalesPorProducto = {};
    for (const lote of inventario) {
      const codigoProducto = lote.codigo_producto; // Usar codigo_producto del inventario
      if (!codigoProducto) continue; // Saltar si no tiene código
      
      const qty = Number(lote.cantidad_actual) || 0;
      const fechaVencimiento = toDate(lote.fecha_vencimiento);
      const esVencido = fechaVencimiento ? fechaVencimiento < ahora : false;
      
      // Convertir kg/litros a g/ml
      let qtyEnGramos = qty;
      if (lote.unidad_medida === 'kg') qtyEnGramos = qty * 1000;
      if (lote.unidad_medida === 'litros') qtyEnGramos = qty * 1000;
      
      const prodInfo = productos[codigoProducto] || {};
      if (!totalesPorProducto[codigoProducto]) {
        totalesPorProducto[codigoProducto] = {
          total: 0,
          totalVencido: 0,
          codigo: codigoProducto,
          nombre: prodInfo.nombre || lote.producto || 'Desconocido',
          stock_minimo: Number(prodInfo.stock_minimo) || 5000, // 5kg/L mínimo en gramos
          unidad_medida: lote.unidad_medida
        };
      }
      if (esVencido) {
        totalesPorProducto[codigoProducto].totalVencido += qtyEnGramos;
      } else {
        totalesPorProducto[codigoProducto].total += qtyEnGramos;
      }
    }

    // Generar alertas por producto (stock bajo / crítico)
    for (const [codigoProducto, info] of Object.entries(totalesPorProducto)) {
      const keyCritico = `stock_critico_${codigoProducto}`;
      const keyBajo = `stock_bajo_${codigoProducto}`;
      
      // Convertir a kg/L para mostrar
      const totalEnKgOL = info.total / 1000;

      if (info.total === 0 && !alertasExistentes.has(keyCritico)) {
        const mensaje = info.totalVencido > 0
          ? `${info.nombre} sin stock utilizable (todo el inventario está vencido)`
          : `${info.nombre} sin stock`;
        await crearAlerta({
          tipo: 'stock_critico',
          titulo: '❌ Stock Agotado',
          mensaje,
          prioridad: 'alta',
          metadata: {
            codigo_producto: info.codigo,
            nombre_producto: info.nombre,
            cantidad_restante: 0,
            cantidad_vencida: info.totalVencido / 1000
          }
        });
        alertasGeneradas.stock_critico++;
        alertasGeneradas.total++;
      }

      // Stock bajo: menos de 5 kg/L
      if (info.total > 0 && totalEnKgOL < 5 && !alertasExistentes.has(keyBajo)) {
        await crearAlerta({
          tipo: 'stock_bajo',
          titulo: '📉 Stock Bajo',
          mensaje: `${info.nombre} con stock bajo`,
          prioridad: 'media',
          metadata: {
            codigo_producto: info.codigo,
            nombre_producto: info.nombre,
            stock_actual: totalEnKgOL.toFixed(1),
            stock_minimo: (info.stock_minimo / 1000).toFixed(1),
            unidad_medida: info.unidad_medida
          }
        });
        alertasGeneradas.stock_bajo++;
        alertasGeneradas.total++;
      }
    }

    // Procesar alertas por lote (vencidos / próximos a caducar)
    for (const lote of inventario) {
      const codigoProducto = lote.codigo_producto;
      const nombreProducto = lote.producto;
      if (!codigoProducto) continue; // Saltar lotes sin código
      
      const loteId = lote.lote || lote.numero_lote || lote.id || 's/lote';

      const fechaVencimiento = toDate(lote.fecha_vencimiento);
      const stockActual = Number(lote.cantidad_actual) || 0;

      // 1. ALERTA: Producto Vencido
      if (fechaVencimiento < ahora && stockActual > 0) {
        const key = `producto_vencido_${codigoProducto}_${loteId}`;
        if (!alertasExistentes.has(key)) {
          await crearAlerta({
            tipo: 'producto_vencido',
            titulo: '🚨 Producto Vencido',
            mensaje: `${nombreProducto} - Lote ${loteId} está vencido`,
            prioridad: 'alta',
            metadata: {
              codigo_producto: codigoProducto,
              nombre_producto: nombreProducto,
              lote: loteId,
              fecha_vencimiento: lote.fecha_vencimiento,
              cantidad_restante: stockActual
            }
          });
          alertasGeneradas.producto_vencido++;
          alertasGeneradas.total++;
        }
      }

      // 2. ALERTA: Próximo a Caducar (7 días)
      else if (fechaVencimiento > ahora && fechaVencimiento <= sieteDelasDelante && stockActual > 0) {
        const diasRestantes = Math.ceil((fechaVencimiento - ahora) / (1000 * 60 * 60 * 24));
        const prioridad = diasRestantes <= 3 ? 'alta' : 'media';
        
        const key = `caducidad_${codigoProducto}_${loteId}`;
        if (!alertasExistentes.has(key)) {
          await crearAlerta({
            tipo: 'caducidad',
            titulo: '⏰ Producto Próximo a Caducar',
            mensaje: `${nombreProducto} - Lote ${loteId} caduca en ${diasRestantes} días`,
            prioridad,
            metadata: {
              codigo_producto: codigoProducto,
              nombre_producto: nombreProducto,
              lote: loteId,
              fecha_vencimiento: lote.fecha_vencimiento,
              dias_restantes: diasRestantes,
              cantidad_restante: stockActual
            }
          });
          alertasGeneradas.caducidad++;
          alertasGeneradas.total++;
        }
      }
    }

    // Generar alertas por checklists pendientes
    for (const checklist of checklists) {
      if (checklist.estado === 'pendiente') {
        // Usar el ID del checklist en la metadata para deduplicación
        const checklistKey = `checklist_pendiente_${checklist.id}`;
        if (!alertasExistentes.has(checklistKey)) {
          const fechaChecklist = checklist.fecha?.toDate ? checklist.fecha.toDate() : new Date(checklist.fecha);
          const diasAtraso = Math.floor((ahora - fechaChecklist) / (1000 * 60 * 60 * 24));
          await crearAlerta({
            tipo: 'checklist_pendiente',
            titulo: '⚠️ Checklist Pendiente',
            mensaje: `Checklist del ${fechaChecklist.toLocaleDateString('es-ES')} - ${checklist.turno} sin completar`,
            prioridad: diasAtraso > 1 ? 'alta' : 'media',
            metadata: {
              checklist_id: checklist.id,
              turno: checklist.turno,
              responsable: checklist.responsable,
              fecha: checklist.fecha,
              dias_atraso: diasAtraso
            }
          });
          alertasGeneradas.checklist_pendiente++;
          alertasGeneradas.total++;
        }
      }
    }

    console.log('✅ Alertas generadas:', alertasGeneradas);
    return alertasGeneradas;

  } catch (error) {
    console.error('❌ Error al generar alertas automáticas:', error);
    throw error;
  }
};

/**
 * Crea una nueva alerta en Firestore
 */
const crearAlerta = async (alertaData) => {
  try {
    await addDoc(collection(db, 'alertas'), {
      ...alertaData,
      estado: 'activa',
      fecha: Timestamp.now(),
      creado_en: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al crear alerta:', error);
    throw error;
  }
};

/**
 * Obtiene resumen de alertas activas
 * @returns {Object} Resumen con contadores por tipo
 */
export const obtenerResumenAlertas = async () => {
  try {
    const alertasSnapshot = await getDocs(
      query(collection(db, 'alertas'), where('estado', '==', 'activa'))
    );

    const resumen = {
      total: 0,
      stock_bajo: 0,
      caducidad: 0,
      producto_vencido: 0,
      stock_critico: 0,
      checklist_pendiente: 0
    };

    alertasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      switch(data.tipo) {
        case 'stock_bajo':
          resumen.stock_bajo++;
          resumen.total++;
          break;
        case 'caducidad':
          resumen.caducidad++;
          resumen.total++;
          break;
        case 'producto_vencido':
          resumen.producto_vencido++;
          resumen.total++;
          break;
        case 'stock_critico':
          resumen.stock_critico++;
          resumen.total++;
          break;
        case 'checklist_pendiente':
          resumen.checklist_pendiente++;
          resumen.total++;
          break;
      }
    });

    return resumen;
  } catch (error) {
    console.error('Error al obtener resumen de alertas:', error);
    return {
      total: 0,
      stock_bajo: 0,
      caducidad: 0,
      producto_vencido: 0,
      stock_critico: 0
    };
  }
};

/**
 * Marca alertas como resueltas
 */
export const resolverAlerta = async (alertaId) => {
  try {
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'alertas', alertaId), {
      estado: 'resuelta',
      fecha_resolucion: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al resolver alerta:', error);
    throw error;
  }
};

/**
 * Limpia alertas duplicadas de checklist
 */
export const limpiarAlertasChecklistDuplicadas = async () => {
  try {
    const { deleteDoc, doc } = await import('firebase/firestore');
    const alertasSnapshot = await getDocs(
      query(collection(db, 'alertas'), 
            where('tipo', '==', 'checklist_pendiente'),
            where('estado', '==', 'activa'))
    );

    // Agrupar por checklist_id y mantener solo la más reciente
    const alertasPorChecklist = new Map();
    
    alertasSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const checklistId = data.metadata?.checklist_id;
      
      if (checklistId) {
        if (!alertasPorChecklist.has(checklistId)) {
          alertasPorChecklist.set(checklistId, []);
        }
        alertasPorChecklist.get(checklistId).push({
          id: docSnapshot.id,
          fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.creado_en || data.fecha)
        });
      }
    });

    let eliminadas = 0;
    
    // Para cada checklist, eliminar todas menos la más reciente
    for (const [checklistId, alertas] of alertasPorChecklist) {
      if (alertas.length > 1) {
        // Ordenar por fecha (más reciente primero)
        alertas.sort((a, b) => b.fecha - a.fecha);
        
        // Eliminar todas excepto la primera (más reciente)
        for (let i = 1; i < alertas.length; i++) {
          await deleteDoc(doc(db, 'alertas', alertas[i].id));
          eliminadas++;
        }
      }
    }

    console.log(`🧹 Alertas duplicadas de checklist eliminadas: ${eliminadas}`);
    return eliminadas;
  } catch (error) {
    console.error('Error al limpiar alertas duplicadas:', error);
    throw error;
  }
};

/**
 * Limpia alertas obsoletas (resueltas hace más de 30 días)
 */
export const limpiarAlertasObsoletas = async () => {
  try {
    const { deleteDoc, doc } = await import('firebase/firestore');
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    const alertasSnapshot = await getDocs(
      query(collection(db, 'alertas'), where('estado', '==', 'resuelta'))
    );

    let eliminadas = 0;
    for (const docSnapshot of alertasSnapshot.docs) {
      const data = docSnapshot.data();
      const fechaResolucion = new Date(data.fecha_resolucion);
      
      if (fechaResolucion < treintaDiasAtras) {
        await deleteDoc(doc(db, 'alertas', docSnapshot.id));
        eliminadas++;
      }
    }

    console.log(`🧹 Alertas obsoletas eliminadas: ${eliminadas}`);
    return eliminadas;
  } catch (error) {
    console.error('Error al limpiar alertas obsoletas:', error);
    throw error;
  }
};
