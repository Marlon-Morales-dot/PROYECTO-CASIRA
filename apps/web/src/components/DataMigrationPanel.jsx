import React, { useState } from 'react';
import {
  Database, Download, Upload, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Play, Settings, FileText, Users, Calendar
} from 'lucide-react';
import dataMigrationService from '../lib/services/data-migration.service.js';

const DataMigrationPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [log, setLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [options, setOptions] = useState({
    migrateUsers: true,
    migrateActivities: true,
    createTestData: false,
    forceUpdate: false
  });

  const handleMigration = async () => {
    setIsRunning(true);
    setResults(null);
    setLog([]);

    try {
      console.log('🚀 Starting migration with options:', options);

      const result = await dataMigrationService.migrateAllData(options);

      setResults(result);
      setLog(result.log || []);

      if (result.success) {
        alert('¡Migración completada exitosamente!\nRevisa los detalles en el panel.');
      } else {
        alert('Error en la migración: ' + result.error);
      }

    } catch (error) {
      console.error('❌ Migration error:', error);
      setResults({ success: false, error: error.message });
      alert('Error durante la migración: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsRunning(true);
      await dataMigrationService.syncSupabaseToLocal();
      alert('Sincronización completada');
    } catch (error) {
      console.error('❌ Sync error:', error);
      alert('Error en la sincronización: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (entry) => {
    if (entry.message.includes('✅') || entry.message.includes('SUCCESS')) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (entry.message.includes('❌') || entry.message.includes('ERROR')) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (entry.message.includes('⚠️') || entry.message.includes('WARN')) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Migración de Datos</h2>
          <p className="text-sm text-gray-500">
            Migra datos de localStorage a Supabase para funcionalidad en tiempo real
          </p>
        </div>
      </div>

      {/* Opciones de Migración */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones de Migración</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.migrateUsers}
              onChange={(e) => setOptions(prev => ({ ...prev, migrateUsers: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">Migrar Usuarios</span>
              <p className="text-xs text-gray-500">Sincronizar usuarios de localStorage a Supabase</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.migrateActivities}
              onChange={(e) => setOptions(prev => ({ ...prev, migrateActivities: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">Migrar Actividades</span>
              <p className="text-xs text-gray-500">Sincronizar actividades de localStorage a Supabase</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.createTestData}
              onChange={(e) => setOptions(prev => ({ ...prev, createTestData: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">Crear Datos de Prueba</span>
              <p className="text-xs text-gray-500">Crear actividad de prueba para validar sistema</p>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.forceUpdate}
              onChange={(e) => setOptions(prev => ({ ...prev, forceUpdate: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-700">Forzar Actualización</span>
              <p className="text-xs text-gray-500">Actualizar registros existentes en Supabase</p>
            </div>
          </label>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleMigration}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{isRunning ? 'Migrando...' : 'Iniciar Migración'}</span>
        </button>

        <button
          onClick={handleSync}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Sincronizar de Supabase</span>
        </button>

        {log.length > 0 && (
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>{showLog ? 'Ocultar Log' : 'Ver Log'}</span>
          </button>
        )}
      </div>

      {/* Resultados */}
      {results && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            {results.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span>Resultados de la Migración</span>
          </h3>

          {results.success ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Usuarios Migrados</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {results.results?.users?.migrated || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Actividades Migradas</p>
                    <p className="text-2xl font-bold text-green-700">
                      {results.results?.activities?.migrated || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Éxitos</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {results.results?.total?.success || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Error en la Migración</h4>
                  <p className="text-sm text-red-600 mt-1">{results.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log de Migración */}
      {showLog && log.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <span>Log de Migración</span>
          </h3>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {log.map((entry, index) => (
                <div key={index} className="flex items-start space-x-3 text-sm">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(entry)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {entry.message.replace(/[🚀📦👥📋✅❌⚠️🔄🧪]/g, '').trim()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {entry.data && (
                      <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border">
                        {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Información Adicional */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Información Importante</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• La migración sincronizará datos locales con Supabase</li>
              <li>• Los usuarios existentes en Supabase no se duplicarán</li>
              <li>• Se recomienda hacer una copia de seguridad antes de migrar</li>
              <li>• Después de la migración, el sistema funcionará en tiempo real</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMigrationPanel;