const sanitize = (value) => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value.toString();
  return value || '';
};

const buildKey = (producto) => {
  if (!producto) return '';
  const codigo = sanitize(producto.codigo_producto);
  const nombre = sanitize(producto.nombre);
  const id = sanitize(producto.id);
  const fallback = sanitize(producto.codigo) || sanitize(producto.sku);
  return (codigo || nombre || id || fallback || '').toUpperCase();
};

export const buildUniqueProductOptions = (productos = []) => {
  const map = new Map();

  productos.forEach((producto) => {
    if (!producto) return;
    const key = buildKey(producto);
    if (!key) return;

    if (!map.has(key)) {
      const codigoNormalizado = sanitize(producto.codigo_producto) || sanitize(producto.id) || key;
      map.set(key, {
        ...producto,
        codigo_producto: codigoNormalizado,
        nombre: sanitize(producto.nombre) || codigoNormalizado,
        optionValue: codigoNormalizado,
        repeticiones: 1
      });
    } else {
      const existente = map.get(key);
      map.set(key, {
        ...existente,
        repeticiones: (existente.repeticiones || 1) + 1
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const nombreA = sanitize(a.nombre).toLocaleLowerCase('es');
    const nombreB = sanitize(b.nombre).toLocaleLowerCase('es');
    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
  });
};
