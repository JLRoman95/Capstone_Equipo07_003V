import React, { useState } from 'react';
import { reporteService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Reportes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const generarReporteInventario = async () => {
    setLoading(true);
    setError('');
    try {
      const blob = await reporteService.inventario();
      downloadBlob(blob, `reporte_inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      setError('Error al generar reporte de inventario');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generarReporteProduccion = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Debe seleccionar fechas de inicio y fin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const blob = await reporteService.produccion(fechaInicio, fechaFin);
      downloadBlob(blob, `reporte_produccion_${fechaInicio}_${fechaFin}.pdf`);
    } catch (error) {
      setError('Error al generar reporte de producción');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>📊 Reportes</h1>
            <p style={{ color: '#6b7280' }}>Generación de reportes en PDF</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
            ← Volver
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {/* Reporte de Inventario */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>📦 Reporte de Inventario</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Genera un reporte PDF con el estado actual del inventario, incluyendo productos, stock y fechas de caducidad.
            </p>
            <button
              onClick={generarReporteInventario}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>

          {/* Reporte de Producción */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>👨‍🍳 Reporte de Producción</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Genera un reporte PDF de la producción en un rango de fechas específico.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="input"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="input"
              />
            </div>

            <button
              onClick={generarReporteProduccion}
              disabled={loading}
              className="btn btn-danger"
              style={{ width: '100%' }}
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>

        {/* Info adicional */}
        <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e40af' }}>ℹ️ Información</h3>
          <p style={{ color: '#1e3a8a', fontSize: '0.875rem' }}>
            Los reportes se generan en formato PDF y se descargarán automáticamente cuando estén listos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
