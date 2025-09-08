# 🚀 CASIRA Connect - Configuración MCP Supabase

## ¿Qué es MCP?
Model Context Protocol (MCP) permite que herramientas de IA como Claude interactúen directamente con tu base de datos Supabase usando lenguaje natural.

## ✅ Lo que puedes hacer con MCP Supabase:
- **Consultar datos:** "Muéstrame todos los usuarios activos"
- **Crear tablas:** "Crea una tabla de eventos con estos campos"
- **Gestionar esquemas:** "Agrega una columna de avatar_url a users"
- **Ejecutar migraciones:** "Migra los datos de localStorage"
- **Ver logs:** "Muéstrame los errores recientes"
- **Gestionar proyectos:** "Crea un branch de desarrollo"

## 🔧 Opciones de Implementación

### 1. MCP Server Oficial de Supabase (RECOMENDADO)

#### Instalación:
```bash
# Instalar globalmente
npm install -g @supabase/mcp-server-supabase
```

#### Para Claude Code:
1. Crea un archivo `mcp_config.json` en tu directorio del proyecto
2. Configura tu token de acceso de Supabase

#### Para Cursor IDE:
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=wlliqmcpiiktcdzwzhdn",
        "--read-only"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "tu_token_aqui"
      }
    }
  }
}
```

### 2. Configuración de Seguridad

#### Modo Solo Lectura (RECOMENDADO para empezar):
```bash
npx @supabase/mcp-server-supabase --project-ref=wlliqmcpiiktcdzwzhdn --read-only
```

#### Modo Completo (con escritura):
```bash
npx @supabase/mcp-server-supabase --project-ref=wlliqmcpiiktcdzwzhdn
```

## 🔐 Obtener Token de Acceso

1. Ve a https://supabase.com/dashboard/account/tokens
2. Genera un nuevo "Personal Access Token"  
3. Guárdalo en tus variables de entorno:

```bash
# Windows
set SUPABASE_ACCESS_TOKEN=tu_token_aqui

# Linux/Mac  
export SUPABASE_ACCESS_TOKEN=tu_token_aqui
```

## 🛠️ Herramientas Disponibles (20+ funciones)

### Gestión de Proyectos:
- `create_project`: Crear nuevos proyectos
- `list_projects`: Listar todos los proyectos
- `get_project_config`: Ver configuración del proyecto

### Base de Datos:
- `execute_sql`: Ejecutar consultas SQL
- `get_schema`: Ver esquema de la base de datos
- `list_tables`: Listar todas las tablas
- `describe_table`: Ver estructura de una tabla

### Migraciones:
- `create_migration`: Crear nueva migración
- `list_migrations`: Ver historial de migraciones  
- `apply_migration`: Aplicar migración

### Autenticación:
- `list_users`: Ver usuarios registrados
- `create_user`: Crear nuevos usuarios
- `update_user`: Actualizar información de usuarios

### Storage:
- `list_buckets`: Ver buckets de almacenamiento
- `create_bucket`: Crear nuevo bucket
- `upload_file`: Subir archivos

### Logs y Monitoreo:
- `get_logs`: Ver logs del sistema
- `get_metrics`: Ver métricas de uso

## 🚦 Ejemplo de Uso

Una vez configurado, podrás hacer preguntas como:

```
"Muéstrame todos los posts de esta semana"
"¿Cuántos usuarios se registraron hoy?"  
"Crea una tabla de categorías con id, nombre y descripción"
"Agrega RLS a la tabla de posts"
"Muéstrame los errores de autenticación de las últimas 24 horas"
```

## ⚠️ Consideraciones de Seguridad

1. **Nunca usar en producción:** Usa solo con proyectos de desarrollo
2. **Modo solo lectura:** Habilita `--read-only` por defecto  
3. **Scope del proyecto:** El servidor solo accede al proyecto configurado
4. **Tokens seguros:** No subas tokens a Git, usa variables de entorno

## 🔄 Estado Actual del Proyecto

Tu proyecto CASIRA Connect ya tiene:
- ✅ Configuración básica de Supabase  
- ✅ Archivo `.mcp-supabase.json` con metadatos
- ✅ Cliente JavaScript funcionando
- ✅ Componentes de testing
- 🔄 **Falta:** Configurar MCP server con token de acceso

## 📋 Próximos Pasos

1. **Obtener token:** Ve a Supabase Dashboard → Account → Access Tokens
2. **Configurar MCP:** Agrega el token a `.mcp-config.json`
3. **Probar conexión:** Ejecuta el servidor MCP
4. **Usar herramientas:** Comienza a hacer consultas en lenguaje natural

---

🎯 **Objetivo:** Permitir que Claude u otras herramientas de IA gestionen tu base de datos Supabase usando comandos en español natural.