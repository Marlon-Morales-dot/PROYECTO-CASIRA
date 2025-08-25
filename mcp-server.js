#!/usr/bin/env node

/**
 * Servidor MCP personalizado para PROYECTO-CASIRA
 * Proporciona herramientas para trabajar con React, Python/Flask y Supabase
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const PROJECT_ROOT = process.env.PROJECT_ROOT || 'C:\\Users\\MARLON\\Desktop\\PROYECTO-CASIRA';
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');

class CasiraServer {
  constructor() {
    this.server = new Server(
      {
        name: 'casira-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'run_frontend_command',
          description: 'Ejecuta comandos npm/pnpm en el frontend React',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Comando a ejecutar (ej: "npm start", "npm run build")',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'run_backend_command',
          description: 'Ejecuta comandos Python en el backend Flask',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'Comando Python a ejecutar (ej: "python app.py", "pip install")',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'read_project_file',
          description: 'Lee archivos del proyecto CASIRA',
          inputSchema: {
            type: 'object',
            properties: {
              filepath: {
                type: 'string',
                description: 'Ruta relativa del archivo desde la raíz del proyecto',
              },
            },
            required: ['filepath'],
          },
        },
        {
          name: 'write_project_file',
          description: 'Escribe o modifica archivos del proyecto',
          inputSchema: {
            type: 'object',
            properties: {
              filepath: {
                type: 'string',
                description: 'Ruta relativa del archivo desde la raíz del proyecto',
              },
              content: {
                type: 'string',
                description: 'Contenido del archivo',
              },
            },
            required: ['filepath', 'content'],
          },
        },
        {
          name: 'list_project_structure',
          description: 'Muestra la estructura de directorios del proyecto',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directorio a listar (opcional, por defecto la raíz)',
              },
            },
          },
        },
        {
          name: 'deploy_to_render',
          description: 'Despliega el proyecto a Render usando git push',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Servicio a desplegar (frontend/backend)',
                enum: ['frontend', 'backend'],
              },
              branch: {
                type: 'string',
                description: 'Rama a desplegar (por defecto main)',
                default: 'main',
              },
            },
            required: ['service'],
          },
        },
        {
          name: 'check_render_logs',
          description: 'Simula la verificación de logs de Render (requiere CLI de Render)',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                description: 'Servicio del cual obtener logs',
              },
              lines: {
                type: 'number',
                description: 'Número de líneas de log (por defecto 50)',
                default: 50,
              },
            },
            required: ['service'],
          },
        },
        {
          name: 'update_render_config',
          description: 'Actualiza la configuración de Render (render.yaml)',
          inputSchema: {
            type: 'object',
            properties: {
              config: {
                type: 'object',
                description: 'Objeto de configuración para render.yaml',
              },
            },
            required: ['config'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'run_frontend_command':
            return await this.runFrontendCommand(args.command);
          
          case 'run_backend_command':
            return await this.runBackendCommand(args.command);
          
          case 'read_project_file':
            return await this.readProjectFile(args.filepath);
          
          case 'write_project_file':
            return await this.writeProjectFile(args.filepath, args.content);
          
          case 'list_project_structure':
            return await this.listProjectStructure(args.directory || '');
          
          case 'deploy_to_render':
            return await this.deployToRender(args.service, args.branch || 'main');
          
          case 'check_render_logs':
            return await this.checkRenderLogs(args.service, args.lines || 50);
          
          case 'update_render_config':
            return await this.updateRenderConfig(args.config);
          
          default:
            throw new Error(`Herramienta desconocida: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async runFrontendCommand(command) {
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: FRONTEND_DIR,
        timeout: 30000 
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Frontend Command: ${command}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error ejecutando comando frontend: ${error.message}`,
          },
        ],
      };
    }
  }

  async runBackendCommand(command) {
    try {
      const { stdout, stderr } = await execAsync(command, { 
        cwd: BACKEND_DIR,
        timeout: 30000 
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Backend Command: ${command}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error ejecutando comando backend: ${error.message}`,
          },
        ],
      };
    }
  }

  async readProjectFile(filepath) {
    try {
      const fullPath = path.join(PROJECT_ROOT, filepath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Archivo: ${filepath}\n\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error leyendo archivo: ${error.message}`,
          },
        ],
      };
    }
  }

  async writeProjectFile(filepath, content) {
    try {
      const fullPath = path.join(PROJECT_ROOT, filepath);
      await fs.writeFile(fullPath, content, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Archivo ${filepath} guardado exitosamente`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error escribiendo archivo: ${error.message}`,
          },
        ],
      };
    }
  }

  async listProjectStructure(directory) {
    try {
      const dirPath = path.join(PROJECT_ROOT, directory);
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      const structure = items
        .map(item => `${item.isDirectory() ? '📁' : '📄'} ${item.name}`)
        .join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Estructura de ${directory || 'proyecto'}:\n\n${structure}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listando directorio: ${error.message}`,
          },
        ],
      };
    }
  }

  async deployToRender(service, branch) {
    try {
      // Verificar que estamos en un repositorio git
      await execAsync('git status', { cwd: PROJECT_ROOT });
      
      // Hacer commit de cambios pendientes si los hay
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: PROJECT_ROOT });
      if (status.trim()) {
        await execAsync('git add .', { cwd: PROJECT_ROOT });
        await execAsync(`git commit -m "Deploy ${service} to Render"`, { cwd: PROJECT_ROOT });
      }
      
      // Push a la rama
      const { stdout, stderr } = await execAsync(`git push origin ${branch}`, { 
        cwd: PROJECT_ROOT,
        timeout: 60000 
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Despliegue de ${service} iniciado en Render (rama: ${branch})\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}\n\nEl despliegue debería comenzar automáticamente en Render.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error desplegando a Render: ${error.message}`,
          },
        ],
      };
    }
  }

  async checkRenderLogs(service, lines) {
    try {
      // Nota: Esto requiere tener el CLI de Render instalado
      // render logs <service-name> --num <lines>
      const { stdout, stderr } = await execAsync(`render logs ${service} --num ${lines}`, { 
        cwd: PROJECT_ROOT,
        timeout: 30000 
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `Logs de ${service} (últimas ${lines} líneas):\n\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error obteniendo logs: ${error.message}\n\nNota: Asegúrate de tener el CLI de Render instalado: npm install -g @render/cli`,
          },
        ],
      };
    }
  }

  async updateRenderConfig(config) {
    try {
      const yamlContent = this.objectToYaml(config);
      const renderConfigPath = path.join(BACKEND_DIR, 'render.yaml');
      
      await fs.writeFile(renderConfigPath, yamlContent, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Configuración de Render actualizada en backend/render.yaml:\n\n${yamlContent}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error actualizando configuración de Render: ${error.message}`,
          },
        ],
      };
    }
  }

  objectToYaml(obj, indent = 0) {
    let yaml = '';
    const spaces = ' '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 2);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}- `;
            yaml += this.objectToYaml(item, indent + 2).replace(/^\s{2}/, '');
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Servidor MCP CASIRA iniciado');
  }
}

const server = new CasiraServer();
server.run().catch(console.error);