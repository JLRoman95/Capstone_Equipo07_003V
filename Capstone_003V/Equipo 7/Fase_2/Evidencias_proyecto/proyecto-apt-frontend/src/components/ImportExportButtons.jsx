/**
 * Componente de Importación y Exportación de Datos
 * Botones para importar archivos Excel/CSV y exportar a PDF
 */

import { useState } from 'react';
import { 
  leerArchivoExcel, 
  leerArchivoCSV, 
  descargarPlantilla 
} from '../services/importService';
import '../styles/ImportExport.css';

export default function ImportExportButtons({ 
  tipo, // 'proveedores', 'productos', 'inventario', 'produccion'
  onImport, // Callback con datos importados
  onExport, // Callback para exportar
  validarDatos, // Función de validación específica del tipo
  permisoImportar = true,
  permisoExportar = true
}) {
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportando(true);
    setError(null);
    setExito(null);

    try {
      let datos;
      
      // Detectar tipo de archivo
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        datos = await leerArchivoExcel(file);
      } else if (file.name.endsWith('.csv')) {
        datos = await leerArchivoCSV(file);
      } else {
        throw new Error('Formato de archivo no soportado. Use .xlsx, .xls o .csv');
      }

      if (datos.length === 0) {
        throw new Error('El archivo no contiene datos');
      }

      // Validar datos si hay función de validación
      let datosValidos = datos;
      let errores = [];
      
      if (validarDatos) {
        const resultado = validarDatos(datos);
        datosValidos = resultado.datosValidos;
        errores = resultado.errores;
      }

      if (errores.length > 0) {
        setError(
          <div>
            <p>Se encontraron {errores.length} error(es):</p>
            <ul style={{ maxHeight: '150px', overflowY: 'auto', textAlign: 'left' }}>
              {errores.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {errores.length > 10 && <li>...y {errores.length - 10} más</li>}
            </ul>
          </div>
        );
        
        if (datosValidos.length === 0) {
          setImportando(false);
          return;
        }
      }

      // Llamar callback con datos válidos
      if (onImport && datosValidos.length > 0) {
        await onImport(datosValidos);
        setExito(`✅ ${datosValidos.length} registro(s) importado(s) correctamente`);
        
        if (errores.length > 0) {
          setError(`⚠️ ${errores.length} registro(s) con errores fueron omitidos`);
        }
      }

    } catch (err) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setImportando(false);
      // Limpiar input para permitir reimportar el mismo archivo
      event.target.value = '';
    }
  };

  const handleDescargarPlantilla = () => {
    try {
      descargarPlantilla(tipo);
      setExito('✅ Plantilla descargada correctamente');
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError(`❌ Error al descargar plantilla: ${err.message}`);
    }
  };

  const handleExportar = async () => {
    try {
      setError(null);
      setExito(null);
      
      if (onExport) {
        await onExport();
        setExito('✅ Reporte exportado correctamente');
        setTimeout(() => setExito(null), 3000);
      }
    } catch (err) {
      setError(`❌ Error al exportar: ${err.message}`);
    }
  };

  return (
    <div className="import-export-container">
      <div className="import-export-buttons">
        {permisoExportar && (
          <button 
            className="btn-export" 
            onClick={handleExportar}
            title="Exportar a PDF"
          >
            📄 Exportar PDF
          </button>
        )}

        {permisoImportar && (
          <>
            <button 
              className="btn-template" 
              onClick={handleDescargarPlantilla}
              title="Descargar plantilla Excel"
            >
              📋 Descargar Plantilla
            </button>

            <label className="btn-import" title="Importar desde Excel o CSV">
              {importando ? '⏳ Importando...' : '📥 Importar Datos'}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                disabled={importando}
                style={{ display: 'none' }}
              />
            </label>
          </>
        )}
      </div>

      {/* Mensajes de feedback */}
      {exito && (
        <div className="import-export-message success">
          {exito}
        </div>
      )}

      {error && (
        <div className="import-export-message error">
          {error}
        </div>
      )}
    </div>
  );
}
