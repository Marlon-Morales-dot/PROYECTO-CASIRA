# Frontend Guide - CASIRA Connect

## 🎯 Descripción General

El frontend de CASIRA Connect está construido con **React 19.1.0** y **Vite 6.3.5**, utilizando las tecnologías más modernas para crear una experiencia de usuario excepcional. Esta guía te ayudará a entender, configurar y contribuir al desarrollo del frontend.

## 🛠️ Tecnologías Utilizadas

### Framework y Build Tools
- **React**: 19.1.0 (Framework principal)
- **Vite**: 6.3.5 (Build tool y dev server)
- **React Router DOM**: 7.6.1 (Enrutamiento)

### Estilos y UI
- **TailwindCSS**: 4.1.7 (Framework de CSS)
- **Radix UI**: Componentes accesibles de alta calidad
- **Framer Motion**: 12.15.0 (Animaciones)
- **Lucide React**: 0.510.0 (Iconos)

### Formularios y Validación
- **React Hook Form**: 7.56.3 (Manejo de formularios)
- **Zod**: 3.24.4 (Validación de esquemas)

### Gráficos y Visualización
- **Recharts**: 2.15.3 (Gráficos y estadísticas)

### Package Manager
- **pnpm**: 10.4.1 (Recomendado)

## 📁 Estructura del Proyecto

```
frontend/
├── public/                    # Assets estáticos
│   └── favicon.ico
├── src/                       # Código fuente
│   ├── components/            # Componentes reutilizables
│   │   └── ui/               # Componentes de UI (Radix)
│   │       ├── accordion.jsx
│   │       ├── alert.jsx
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── dialog.jsx
│   │       ├── form.jsx
│   │       ├── input.jsx
│   │       ├── table.jsx
│   │       └── ... (20+ componentes más)
│   ├── hooks/                 # Custom hooks
│   │   └── use-mobile.js
│   ├── lib/                   # Utilidades
│   │   └── utils.js
│   ├── assets/                # Imágenes y recursos
│   │   └── react.svg
│   ├── App.jsx               # Componente principal
│   ├── App.css               # Estilos globales
│   ├── main.jsx              # Punto de entrada
│   └── index.css             # Estilos base
├── dist/                      # Build de producción
├── node_modules/              # Dependencias
├── components.json            # Configuración Radix UI
├── eslint.config.js           # Configuración ESLint
├── jsconfig.json              # Configuración JavaScript
├── package.json               # Dependencias y scripts
├── pnpm-lock.yaml             # Lock file de pnpm
├── vite.config.js             # Configuración Vite
└── index.html                 # Template HTML
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** >= 18.x
- **pnpm** (recomendado) o **npm**

### 1. Instalar Dependencias
```bash
cd frontend
pnpm install
```

### 2. Variables de Entorno (Opcional)
Crear archivo `.env` en el directorio frontend:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_TITLE=CASIRA Connect
```

### 3. Ejecutar en Desarrollo
```bash
pnpm run dev --host
# o
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### 4. Build para Producción
```bash
pnpm run build
# o
npm run build
```

Los archivos se generarán en el directorio `dist/`

## 📋 Scripts Disponibles

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "vite build",            // Build de producción
  "lint": "eslint .",               // Linter
  "preview": "vite preview"         // Preview del build
}
```

## 🏗️ Arquitectura de Componentes

### Componente Principal (App.jsx)
```javascript
// Estructura principal con React Router
<Router>
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Router>
```

### Landing Page
- **Propósito**: Página principal para visitantes y donantes
- **Características**:
  - Hero section con call-to-action
  - Galería de proyectos destacados
  - Estadísticas de impacto en tiempo real
  - Timeline de obras realizadas
  - Footer con información de contacto

### Login/Auth Page
- **Propósito**: Autenticación de usuarios
- **Características**:
  - Formulario de login responsivo
  - Validación con React Hook Form + Zod
  - Integración preparada para Supabase Auth
  - Manejo de estados de carga y error

### Dashboard Social
- **Propósito**: Interface principal para usuarios autenticados
- **Características**:
  - Timeline de posts sociales
  - Sidebar con navegación
  - Sistema de likes y comentarios
  - Perfil de usuario
  - Configuraciones

## 🎨 Sistema de Diseño

### Colores Principales
```css
:root {
  --primary: 220 90% 56%;          /* Azul CASIRA */
  --secondary: 220 14% 96%;        /* Gris claro */
  --accent: 142 76% 36%;           /* Verde impacto */
  --destructive: 0 84% 60%;        /* Rojo alertas */
  --background: 0 0% 100%;         /* Blanco */
  --foreground: 222 84% 5%;        /* Negro texto */
}
```

### Tipografía
- **Font Family**: Sistema (system-ui, sans-serif)
- **Tamaños**: text-xs a text-4xl
- **Pesos**: font-normal, font-medium, font-semibold, font-bold

### Espaciado
- **Margins/Padding**: 0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64
- **Grid**: grid-cols-1 a grid-cols-12
- **Gaps**: gap-1 a gap-8

## 🔧 Componentes Radix UI Utilizados

### Navegación
- **Accordion**: Secciones desplegables
- **NavigationMenu**: Menú principal
- **Breadcrumb**: Migas de pan

### Formularios
- **Button**: Botones con variantes
- **Input**: Campos de entrada
- **Textarea**: Áreas de texto
- **Select**: Selectores dropdown
- **Checkbox**: Casillas de verificación
- **RadioGroup**: Grupos de radio buttons
- **Form**: Formularios validados

### Overlays
- **Dialog**: Modales y diálogos
- **AlertDialog**: Diálogos de confirmación
- **Sheet**: Paneles laterales
- **Drawer**: Cajones deslizables
- **Popover**: Contenido emergente
- **Tooltip**: Tooltips informativos

### Visualización
- **Card**: Tarjetas de contenido
- **Avatar**: Avatares de usuario
- **Badge**: Etiquetas y badges
- **Progress**: Barras de progreso
- **Separator**: Separadores visuales
- **Skeleton**: Placeholders de carga

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px    /* Móviles grandes */
md: 768px    /* Tablets */
lg: 1024px   /* Laptops */
xl: 1280px   /* Desktops */
2xl: 1536px  /* Pantallas grandes */
```

### Mobile First
Todos los componentes están diseñados con enfoque "mobile-first":
```jsx
// Ejemplo de componente responsive
<div className="
  flex flex-col          /* Móvil: columna */
  md:flex-row           /* Tablet+: fila */
  p-4                   /* Padding móvil */
  md:p-6                /* Padding tablet+ */
">
```

## 🎭 Custom Hooks

### useMobile
```javascript
// Hook para detectar dispositivos móviles
import { useMobile } from './hooks/use-mobile';

function MyComponent() {
  const isMobile = useMobile();
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

## 🔄 Gestión de Estado

### Estado Local (useState)
Para componentes individuales:
```javascript
const [projects, setProjects] = useState([]);
const [isLoading, setIsLoading] = useState(true);
```

### Comunicación con API
```javascript
// Función para cargar datos
const loadProjects = async () => {
  try {
    const response = await fetch('https://api-url/projects/featured');
    const data = await response.json();
    setProjects(data.projects);
  } catch (error) {
    console.error('Error loading projects:', error);
  }
};
```

## 🎯 Mejores Prácticas

### Estructura de Componentes
```javascript
// Formato recomendado para componentes
function ComponentName({ prop1, prop2 }) {
  // 1. Hooks
  const [state, setState] = useState(initialValue);
  
  // 2. Efectos
  useEffect(() => {
    // Lógica de efectos
  }, [dependencies]);
  
  // 3. Handlers
  const handleClick = () => {
    // Lógica del handler
  };
  
  // 4. Render
  return (
    <div className="component-classes">
      {/* Contenido */}
    </div>
  );
}
```

### Nomenclatura
- **Componentes**: PascalCase (`MyComponent`)
- **Variables**: camelCase (`myVariable`)
- **CSS Classes**: kebab-case (`my-class`)
- **Archivos**: kebab-case (`my-component.jsx`)

### Performance
- Usa `React.memo()` para componentes que no cambian frecuentemente
- Implementa lazy loading para componentes pesados
- Optimiza imágenes con formatos modernos (WebP, AVIF)

## 🧪 Testing (Próximamente)

### Configuración Recomendada
- **Vitest**: Testing framework
- **React Testing Library**: Testing de componentes
- **Cypress**: Testing E2E

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Configuración automática con vercel.json
pnpm run build
vercel --prod
```

### Netlify
```bash
pnpm run build
netlify deploy --prod --dir=dist
```

### Servidor Estático
```bash
pnpm run build
# Servir archivos en dist/ con cualquier servidor web
```

## 🔧 Troubleshooting

### Problemas Comunes

**Error de módulos no encontrados:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Errores de ESLint:**
```bash
pnpm run lint --fix
```

**Build fallando:**
```bash
# Verificar variables de entorno
# Limpiar cache de Vite
rm -rf dist .vite
pnpm run build
```

## 📚 Recursos Adicionales

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Framer Motion](https://www.framer.com/motion/)

## 🤝 Contribución

### Configurar Entorno de Desarrollo
1. Fork del repositorio
2. Instalar dependencias: `pnpm install`
3. Crear branch: `git checkout -b feature/nueva-funcionalidad`
4. Desarrollar siguiendo las convenciones
5. Hacer commit: `git commit -m "feat: agregar nueva funcionalidad"`
6. Push y crear Pull Request

### Convenciones de Commit
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Documentación
- `style:` Cambios de estilo
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Tareas de mantenimiento

¡Gracias por contribuir al futuro de CASIRA Connect! 🌟