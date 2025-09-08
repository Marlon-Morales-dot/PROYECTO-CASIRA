// ============= Supabase Connection Test Component =============
import React, { useState, useEffect } from 'react'
import { supabaseSetup } from '../lib/supabase-setup.js'
import { supabaseInspector } from '../lib/supabase-inspector.js'
import { supabaseTablesCreator } from '../lib/supabase-tables-creator.js'
import { supabaseMigration } from '../lib/supabase-migration.js'
import { supabaseSchemaChecker } from '../lib/supabase-schema-checker.js'
import { supabaseTableFixer } from '../lib/supabase-table-fixer.js'

const SupabaseTest = () => {
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('idle')

  const runTests = async () => {
    setLoading(true)
    setStep('testing')
    
    try {
      // First inspect current project
      setStep('🔍 Inspeccionando proyecto actual...')
      const inspection = await supabaseInspector.inspectProject()
      setResults(prev => ({ ...prev, inspection }))

      // Test connection
      setStep('🔄 Probando conexión...')
      const connectionResult = await supabaseSetup.testConnection()
      setResults(prev => ({ ...prev, connection: connectionResult }))

      if (connectionResult) {
        // Check schema
        setStep('🏗️ Verificando esquema de base de datos...')
        const schemaResults = await supabaseSetup.createSchema()
        setResults(prev => ({ ...prev, schema: schemaResults }))
        
        // Get SQL schemas for manual creation
        const sqlSchemas = supabaseSetup.getSQLSchemas()
        setResults(prev => ({ ...prev, sqlSchemas }))
        
        // Check RLS
        const rlsResults = await supabaseSetup.checkRLS()
        setResults(prev => ({ ...prev, rls: rlsResults }))
      }
      
      setStep('completed')
    } catch (error) {
      console.error('Error during setup:', error)
      setResults(prev => ({ ...prev, error: error.message }))
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const runInspection = async () => {
    setLoading(true)
    try {
      const inspection = await supabaseInspector.inspectProject()
      setResults({ inspection })
      setStep('inspected')
    } catch (error) {
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const createMissingTables = async () => {
    setLoading(true)
    setStep('🔧 Creando tablas faltantes...')
    
    try {
      const tableCreationResult = await supabaseTablesCreator.testTableCreation()
      const completeSQL = supabaseTablesCreator.getCompleteSQL()
      
      setResults(prev => ({ 
        ...prev, 
        tableCreation: tableCreationResult,
        completeSQL: completeSQL
      }))
      setStep('table-creation-completed')
    } catch (error) {
      setResults(prev => ({ ...prev, error: error.message }))
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const migrateData = async () => {
    setLoading(true)
    setStep('📦 Migrando datos de localStorage a Supabase...')
    
    try {
      const migrationResults = await supabaseMigration.migrateAllData()
      setResults(prev => ({ 
        ...prev, 
        migration: migrationResults
      }))
      setStep('migration-completed')
    } catch (error) {
      setResults(prev => ({ ...prev, error: error.message }))
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    setStep('📊 Verificando estado de migración...')
    
    try {
      const statusResult = await supabaseMigration.checkMigrationStatus()
      setResults(prev => ({ 
        ...prev, 
        status: statusResult
      }))
      setStep('status-checked')
    } catch (error) {
      setResults(prev => ({ ...prev, error: error.message }))
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const checkSchema = async () => {
    setLoading(true)
    setStep('🔍 Verificando esquema de tablas...')
    
    try {
      const schemaResult = await supabaseSchemaChecker.getCorrectedSchemas()
      const missingColumnsSQL = supabaseSchemaChecker.generateMissingColumnSQL()
      
      setResults(prev => ({ 
        ...prev, 
        schemaCheck: schemaResult,
        missingColumnsSQL
      }))
      setStep('schema-checked')
    } catch (error) {
      setResults(prev => ({ ...prev, error: error.message }))
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const fixTables = async () => {
    setLoading(true)
    setStep('🔧 Arreglando estructura de tablas...')
    
    try {
      const fixResult = await supabaseTableFixer.generateTableFixSQL()
      
      setResults(prev => ({ 
        ...prev, 
        tableFix: fixResult
      }))
      setStep('tables-fixed')
    } catch (error) {
      setResults(prev => ({ ...prev, error: error.message }))
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        🧪 Supabase Connection Test
      </h2>
      
      <div className="mb-4 flex gap-2 flex-wrap">
        <button 
          onClick={runInspection}
          disabled={loading}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          {loading && step.includes('Inspeccionando') ? 'Inspeccionando...' : '🔍 Inspeccionar'}
        </button>
        
        <button 
          onClick={runTests}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Ejecutando...' : '🧪 Test Completo'}
        </button>

        <button 
          onClick={createMissingTables}
          disabled={loading}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          {loading && step.includes('Creando') ? 'Creando...' : '🔧 Crear Tablas'}
        </button>

        <button 
          onClick={migrateData}
          disabled={loading}
          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          {loading && step.includes('Migrando') ? 'Migrando...' : '📦 Migrar Datos'}
        </button>

        <button 
          onClick={checkStatus}
          disabled={loading}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
        >
          📊 Estado
        </button>

        <button 
          onClick={checkSchema}
          disabled={loading}
          className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          {loading && step.includes('esquema') ? 'Verificando...' : '🔍 Esquema'}
        </button>

        <button 
          onClick={fixTables}
          disabled={loading}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {loading && step.includes('Arreglando') ? 'Arreglando...' : '🔧 Arreglar Tablas'}
        </button>
      </div>

      {step !== 'idle' && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="text-sm font-medium">Estado: {step}</p>
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {results.inspection && (
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">🔍 Inspección del Proyecto:</h3>
              <div className="text-sm space-y-2">
                <p><strong>Proyecto:</strong> {results.inspection.projectId}</p>
                <p><strong>URL:</strong> {results.inspection.projectUrl}</p>
                
                {/* Auth Status */}
                <div className={`p-2 rounded ${results.inspection.auth?.available ? 'bg-green-100' : 'bg-red-100'}`}>
                  <strong>Auth:</strong> {results.inspection.auth?.available ? '✅ Disponible' : '❌ No disponible'}
                  {results.inspection.auth?.error && <div className="text-xs text-red-600">{results.inspection.auth.error}</div>}
                </div>

                {/* Tables Status */}
                <div className="mt-3">
                  <strong>Tablas encontradas:</strong>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {Object.entries(results.inspection.tables || {}).map(([table, info]) => (
                      <div key={table} className={`p-1 rounded text-xs ${info.exists ? 'bg-green-100' : 'bg-red-100'}`}>
                        {table}: {info.exists ? `✅ (${info.recordCount || 0} registros)` : '❌'}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Status */}
                <div className={`p-2 rounded ${results.inspection.storage?.available ? 'bg-green-100' : 'bg-red-100'}`}>
                  <strong>Storage:</strong> {results.inspection.storage?.available ? '✅ Disponible' : '❌ No disponible'}
                  {results.inspection.storage?.buckets && (
                    <div className="text-xs">Buckets: {results.inspection.storage.buckets.length}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {results.connection !== undefined && (
            <div className={`p-3 rounded ${results.connection ? 'bg-green-100' : 'bg-red-100'}`}>
              <h3 className="font-semibold">
                {results.connection ? '✅ Conexión Exitosa' : '❌ Error de Conexión'}
              </h3>
            </div>
          )}

          {results.schema && (
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">📊 Creación de Tablas:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(results.schema).map(([table, result]) => (
                  <div key={table} className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <span className="font-medium">{table}:</span> 
                    {result.success ? ' ✅' : ' ❌'}
                    {result.error && <div className="text-xs text-red-600">{result.error}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.rls && (
            <div className="p-3 bg-purple-50 rounded">
              <h3 className="font-semibold mb-2">🔒 Seguridad (RLS):</h3>
              <p className="text-sm">{results.rls.message}</p>
            </div>
          )}

          {results.tableCreation && (
            <div className="p-3 bg-orange-50 rounded">
              <h3 className="font-semibold mb-2">🔧 Creación de Tablas:</h3>
              <div className="text-sm">
                <p><strong>Auto-creación:</strong> {results.tableCreation.canAutoCreate ? '✅ Posible' : '❌ No posible'}</p>
                <p><strong>Mensaje:</strong> {results.tableCreation.message}</p>
                {results.tableCreation.error && (
                  <p className="text-red-600"><strong>Error:</strong> {results.tableCreation.error}</p>
                )}
              </div>
            </div>
          )}

          {results.completeSQL && (
            <div className="p-3 bg-yellow-50 rounded">
              <h3 className="font-semibold mb-2">📋 SQL para ejecutar en Supabase:</h3>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div className="max-h-64 overflow-y-auto">
                  <pre>{results.completeSQL}</pre>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(results.completeSQL)}
                  className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  📋 Copiar SQL
                </button>
              </div>
            </div>
          )}

          {results.migration && (
            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-semibold mb-2">📦 Resultados de Migración:</h3>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white rounded">
                    <strong>👥 Usuarios:</strong> {results.migration.users?.migrated || 0} migrados
                    {results.migration.users?.errors?.length > 0 && (
                      <div className="text-red-600 text-xs">
                        {results.migration.users.errors.length} errores
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white rounded">
                    <strong>🏃 Actividades:</strong> {results.migration.activities?.migrated || 0} migradas
                    {results.migration.activities?.errors?.length > 0 && (
                      <div className="text-red-600 text-xs">
                        {results.migration.activities.errors.length} errores
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white rounded">
                    <strong>📝 Posts:</strong> {results.migration.posts?.migrated || 0} migrados
                    {results.migration.posts?.errors?.length > 0 && (
                      <div className="text-red-600 text-xs">
                        {results.migration.posts.errors.length} errores
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white rounded">
                    <strong>💬 Comentarios:</strong> {results.migration.comments?.migrated || 0} migrados
                    {results.migration.comments?.errors?.length > 0 && (
                      <div className="text-red-600 text-xs">
                        {results.migration.comments.errors.length} errores
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {results.status && (
            <div className="p-3 bg-indigo-50 rounded">
              <h3 className="font-semibold mb-2">📊 Estado de Migración:</h3>
              <div className="text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-indigo-700">Supabase:</h4>
                    <ul className="text-xs space-y-1">
                      <li>👥 Usuarios: {results.status.supabase?.users || 0}</li>
                      <li>🏃 Actividades: {results.status.supabase?.activities || 0}</li>
                      <li>📝 Posts: {results.status.supabase?.posts || 0}</li>
                      <li>🔔 Notificaciones: {results.status.supabase?.notifications || 0}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">LocalStorage:</h4>
                    <ul className="text-xs space-y-1">
                      <li>👥 Usuarios: {results.status.localStorage?.users || 0}</li>
                      <li>🏃 Actividades: {results.status.localStorage?.activities || 0}</li>
                      <li>📝 Posts: {results.status.localStorage?.posts || 0}</li>
                      <li>💬 Comentarios: {results.status.localStorage?.comments || 0}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {results.schemaCheck && (
            <div className="p-3 bg-indigo-50 rounded">
              <h3 className="font-semibold mb-2">🔍 Verificación de Esquema:</h3>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(results.schemaCheck.actualSchemas).map(([tableName, info]) => (
                    <div key={tableName} className={`p-2 rounded border ${info.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <strong>{tableName}:</strong> {info.exists ? '✅' : '❌'}
                      {info.exists && info.columns && (
                        <div className="text-xs mt-1 text-gray-600">
                          Columnas: {info.columns.join(', ')}
                        </div>
                      )}
                      {!info.exists && info.error && (
                        <div className="text-xs mt-1 text-red-600">
                          Error: {info.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {results.schemaCheck.corrections && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                    <strong>⚠️ Correcciones necesarias:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>Posts - image_url: {results.schemaCheck.corrections.posts?.hasImageUrl ? '✅' : '❌ Falta'}</li>
                      <li>Notifications - action_url: {results.schemaCheck.corrections.notifications?.hasActionUrl ? '✅' : '❌ Falta'}</li>
                      <li>Notifications - read: {results.schemaCheck.corrections.notifications?.hasRead ? '✅' : '❌ Falta'}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {results.tableFix && (
            <div className="p-3 bg-red-50 rounded">
              <h3 className="font-semibold mb-2">🔧 Reparación Completa de Tablas:</h3>
              <div className="text-sm mb-3">
                <h4 className="font-medium">Verificación de estructura:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {Object.entries(results.tableFix.verification || {}).map(([table, result]) => (
                    <div key={table} className={`p-2 rounded text-xs ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                      <strong>{table}:</strong> {result.success ? '✅' : '❌'}
                      {result.error && <div className="text-red-600">{result.error}</div>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div className="max-h-64 overflow-y-auto">
                  <pre>{results.tableFix.sql}</pre>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(results.tableFix.sql)}
                  className="mt-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                >
                  📋 Copiar SQL de Reparación
                </button>
              </div>
            </div>
          )}

          {results.missingColumnsSQL && (
            <div className="p-3 bg-orange-50 rounded">
              <h3 className="font-semibold mb-2">🔧 SQL para agregar columnas faltantes:</h3>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                <div className="max-h-48 overflow-y-auto">
                  <pre>{results.missingColumnsSQL}</pre>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(results.missingColumnsSQL)}
                  className="mt-2 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                >
                  📋 Copiar SQL
                </button>
              </div>
            </div>
          )}

          {results.sqlSchemas && (
            <div className="p-3 bg-yellow-50 rounded">
              <h3 className="font-semibold mb-2">📋 SQL Schemas individuales:</h3>
              <div className="text-xs space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(results.sqlSchemas).map(([tableName, sql]) => (
                  <details key={tableName} className="border rounded p-2">
                    <summary className="font-medium cursor-pointer">{tableName}</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {sql.trim()}
                    </pre>
                  </details>
                ))}
              </div>
            </div>
          )}

          {results.error && (
            <div className="p-3 bg-red-100 rounded">
              <h3 className="font-semibold text-red-700">❌ Error General:</h3>
              <p className="text-sm text-red-600">{results.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">💡 Instrucciones de Migración:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li><strong>🔍 Inspeccionar:</strong> Revisa el estado actual de tu proyecto</li>
          <li><strong>📊 Estado:</strong> Compara datos entre localStorage y Supabase</li>
          <li><strong>📦 Migrar Datos:</strong> Transfiere todos los datos de localStorage a Supabase</li>
          <li><strong>🧪 Test Completo:</strong> Verifica que todo funcione correctamente</li>
        </ol>
        <div className="mt-3 p-3 bg-blue-50 rounded text-xs">
          <strong>⚠️ Importante:</strong> La migración creará copias de seguridad automáticamente. 
          Los datos se migrarán de forma segura sin perder información.
        </div>
      </div>
    </div>
  )
}

export default SupabaseTest