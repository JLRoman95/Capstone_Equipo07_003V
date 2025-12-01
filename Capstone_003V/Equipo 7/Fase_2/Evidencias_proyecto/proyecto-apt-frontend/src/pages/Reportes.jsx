import React, { useState } from 'react';
import { inventarioFirebase, produccionFirebase, proveedoresFirebase, productosFirebase, checklistsFirebase, alertasFirebase } from '../services/firestoreService';
import { exportarInventarioPDF, exportarProduccionPDF, exportarReporteConsolidadoPDF } from '../services/exportService';
import { useNavigate } from 'react-router-dom';
import { buildConsolidatedReportPayload } from '../utils/reportUtils';

const Reportes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fechaInicioGeneral, setFechaInicioGeneral] = useState('');
  const [fechaFinGeneral, setFechaFinGeneral] = useState('');
  const generarReporteGeneral = async () => {
    if (!fechaInicioGeneral || !fechaFinGeneral) {
      setError('Debe seleccionar fechas de inicio y fin para el reporte general');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Fechas
      const inicio = new Date(fechaInicioGeneral);
      const fin = new Date(fechaFinGeneral);
      fin.setHours(23, 59, 59, 999);

      // Consultar todos los datos
      const [proveedores, productos, inventario, produccion, checklists, alertas] = await Promise.all([
        proveedoresFirebase.listar(),
        productosFirebase.listar(),
        inventarioFirebase.listar(),
        produccionFirebase.listar(),
        checklistsFirebase.listar(),
        alertasFirebase.listar()
      ]);

      // Filtrar por fechas
      const inventarioFiltrado = inventario.filter(i => {
        const fecha = new Date(i.fecha_ingreso);
        return fecha >= inicio && fecha <= fin;
      });
      const produccionFiltrada = produccion.filter(p => {
        const fecha = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
        return fecha >= inicio && fecha <= fin;
      });
      const checklistsFiltrados = checklists.filter(c => {
        const fecha = c.fecha?.toDate ? c.fecha.toDate() : new Date(c.fecha);
        return fecha >= inicio && fecha <= fin;
      });
      const alertasFiltradas = alertas.filter(a => {
        const fecha = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
        return fecha >= inicio && fecha <= fin;
      });

      const datos = buildConsolidatedReportPayload({
        proveedores,
        productos,
        inventario: inventarioFiltrado,
        produccion: produccionFiltrada,
        checklists: checklistsFiltrados,
        alertas: alertasFiltradas
      });

      exportarReporteConsolidadoPDF(datos);
    } catch (error) {
      setError('Error al generar reporte general');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generarReporteInventario = async () => {
    setLoading(true);
    setError('');
    try {
      const inventario = await inventarioFirebase.listar();
      if (inventario.length === 0) {
        setError('No hay datos de inventario para exportar');
        return;
      }
      exportarInventarioPDF(inventario);
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
      const produccionCompleta = await produccionFirebase.listar();
      
      // Filtrar por rango de fechas
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      
      const produccionFiltrada = produccionCompleta.filter(p => {
        const fechaProd = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
        return fechaProd >= inicio && fechaProd <= fin;
      });
      
      if (produccionFiltrada.length === 0) {
        setError('No hay datos de producción en el rango de fechas seleccionado');
        return;
      }
      
      exportarProduccionPDF(produccionFiltrada);
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
          {/* Reporte General Ejecutivo */}
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>📑 Reporte General Ejecutivo</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Genera un reporte PDF con todos los datos del sistema (inventario, producción, alertas, checklists, proveedores) filtrados por rango de fechas.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicioGeneral}
                onChange={(e) => setFechaInicioGeneral(e.target.value)}
                className="input"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Fecha Fin</label>
              <input
                type="date"
                value={fechaFinGeneral}
                onChange={(e) => setFechaFinGeneral(e.target.value)}
                className="input"
              />
            </div>
            <button
              onClick={generarReporteGeneral}
              disabled={loading}
              className="btn btn-info"
              style={{ width: '100%' }}
            >
              {loading ? 'Generando...' : 'Generar Reporte Ejecutivo'}
            </button>
          </div>
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
