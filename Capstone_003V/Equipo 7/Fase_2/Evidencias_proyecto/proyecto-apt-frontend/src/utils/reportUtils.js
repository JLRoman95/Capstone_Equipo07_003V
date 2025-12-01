import { resumirMermasPorProducto } from '../services/exportService';

const sanitizeText = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value.toString();
  return value || '';
};

const toSafeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const d = value.toDate();
      return isNaN(d) ? null : d;
    }
    if (typeof value.seconds === 'number') {
      const d = new Date(value.seconds * 1000);
      return isNaN(d) ? null : d;
    }
  }
  const date = new Date(value);
  return isNaN(date) ? null : date;
};

const buildProductoLookup = (productos = []) => {
  return productos.reduce((acc, producto) => {
    if (!producto) return acc;
    const key = sanitizeText(producto.codigo_producto).toUpperCase();
    if (key) acc[key] = producto.nombre || producto.codigo_producto;
    return acc;
  }, {});
};

const calcularProductosPorVencer = (inventario = [], limiteDias = 7) => {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return inventario
    .map((item) => {
      const fechaVenc = toSafeDate(item.fecha_vencimiento);
      const diasRestantes = fechaVenc ? Math.ceil((fechaVenc - new Date()) / MS_PER_DAY) : null;
      return {
        codigo_producto: item.codigo_producto || item.producto || 'SIN-CODIGO',
        lote: item.lote || item.numero_lote || 'Sin lote',
        fecha_vencimiento: item.fecha_vencimiento || (fechaVenc ? fechaVenc.toISOString() : ''),
        diasRestantes
      };
    })
    .filter((item) => Number.isFinite(item.diasRestantes) && item.diasRestantes >= 0 && item.diasRestantes <= limiteDias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
};

const buildAlertasCriticas = (alertas = []) => {
  return alertas
    .filter((alerta) => sanitizeText(alerta.prioridad).toLowerCase() === 'alta')
    .filter((alerta) => sanitizeText(alerta.estado).toLowerCase() === 'activa')
    .map((alerta) => ({
      prioridad: alerta.prioridad || 'alta',
      tipo: alerta.tipo || alerta.categoria || 'N/D',
      descripcion: alerta.descripcion || alerta.detalle || alerta.titulo || alerta.mensaje || 'Sin descripción'
    }));
};

export const buildConsolidatedReportPayload = (
  {
    proveedores = [],
    productos = [],
    inventario = [],
    produccion = [],
    checklists = [],
    alertas = []
  },
  { limiteDiasVencimiento = 7 } = {}
) => {
  const productoLookup = buildProductoLookup(productos);
  const productosProximosVencer = calcularProductosPorVencer(inventario, limiteDiasVencimiento);
  const mermasResumen = resumirMermasPorProducto(produccion, productoLookup);
  const alertasActivas = alertas.filter((alerta) => sanitizeText(alerta.estado).toLowerCase() === 'activa');

  return {
    proveedores: proveedores.length,
    productos: productos.length,
    inventario: inventario.length,
    produccion: produccion.length,
    checklists: checklists.length,
    checklistsCompletos: checklists.filter((c) => sanitizeText(c.estado).toLowerCase() === 'completo').length,
    alertasActivas: alertasActivas.length,
    alertasCriticas: buildAlertasCriticas(alertas),
    productosProximosVencer,
    mermasResumen
  };
};
