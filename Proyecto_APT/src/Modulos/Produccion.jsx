import React, { useState, useEffect } from 'react';
import './Produccion.css';

const STORAGE_KEY = 'apt_produccion_v1';

export default function Produccion() {
  const [fecha, setFecha] = useState('');
  const [responsable, setResponsable] = useState('');
  const [turno, setTurno] = useState('Mañana');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      setFecha(parsed.fecha || '');
      setResponsable(parsed.responsable || '');
      setTurno(parsed.turno || 'Mañana');
      setRows(parsed.rows || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fecha, responsable, turno, rows }));
  }, [fecha, responsable, turno, rows]);

  const addRow = () => setRows([...rows, { producto: '', cantidad: '', temp: '', tiempo: '', observaciones: '' }]);
  const updateRow = (i, key, value) => { const copy = [...rows]; copy[i][key] = value; setRows(copy); };
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ fecha, responsable, turno, rows }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `produccion_${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRows([]);
    setFecha('');
    setResponsable('');
    setTurno('Mañana');
  };

  return (
    <section className="prod-root">
      <header className="prod-header">
        <h1>Registro de Producción de Alimentos (PCC2)</h1>
        <div className="prod-actions">
          <button className="btn btn-green" onClick={addRow}>Agregar Fila</button>
          <button className="btn" onClick={exportJson}>Exportar JSON</button>
          <button className="btn btn-ghost" onClick={clearStorage}>Limpiar</button>
        </div>
      </header>

      <form className="prod-meta" onSubmit={(e)=>e.preventDefault()}>
        <label>
          Fecha
          <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
        </label>

        <label>
          Responsable
          <input type="text" placeholder="Nombre del responsable" value={responsable} onChange={(e)=>setResponsable(e.target.value)} />
        </label>

        <label>
          Turno
          <select value={turno} onChange={(e)=>setTurno(e.target.value)}>
            <option>Mañana</option>
            <option>Tarde</option>
            <option>Noche</option>
          </select>
        </label>
      </form>

      <div className="prod-table-wrap">
        <table className="prod-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Temp. Cocción (°C)</th>
              <th>Tiempo</th>
              <th>Observaciones</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="empty-row">
                <td colSpan="6">No hay filas. Usa "Agregar Fila" para comenzar.</td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input value={r.producto} onChange={(e)=>updateRow(i,'producto',e.target.value)} placeholder="Nombre del producto" /></td>
                <td><input value={r.cantidad} onChange={(e)=>updateRow(i,'cantidad',e.target.value)} placeholder="Cantidad" /></td>
                <td><input value={r.temp} onChange={(e)=>updateRow(i,'temp',e.target.value)} placeholder="°C" /></td>
                <td><input value={r.tiempo} onChange={(e)=>updateRow(i,'tiempo',e.target.value)} placeholder="Tiempo" /></td>
                <td><input value={r.observaciones} onChange={(e)=>updateRow(i,'observaciones',e.target.value)} placeholder="Observaciones" /></td>
                <td className="cell-actions">
                  <button className="btn btn-danger" onClick={()=>removeRow(i)} title="Eliminar fila">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}