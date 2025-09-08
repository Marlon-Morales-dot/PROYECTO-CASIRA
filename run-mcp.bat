@echo off
echo 🚀 Iniciando Supabase MCP Server...
echo.
echo 🔑 Configurando token...
set SUPABASE_ACCESS_TOKEN=sbp_aef4f6e449154b1380d0ec6ab1a0d14c260bf577

echo 📊 Project Reference: wlliqmcpiiktcdzwzhdn  
echo 🔒 Mode: Read-only
echo.

echo ⚡ Ejecutando servidor MCP...
npx @supabase/mcp-server-supabase --project-ref=wlliqmcpiiktcdzwzhdn --read-only

echo.
echo ✅ MCP Server terminado
pause