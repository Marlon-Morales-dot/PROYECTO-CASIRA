# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (apps/web/)
```bash
# Development
npm run dev:web              # Start React dev server (port 5173)
cd apps/web && npm run dev   # Alternative way

# Build & Deploy
npm run build               # Build production frontend
npm run build:web          # Same as above
cd apps/web && npm run build:render  # Build with detailed logging
npm run deploy:vercel      # Deploy to Vercel

# Linting & Quality
npm run lint               # ESLint for frontend code
cd apps/web && npm run lint # Alternative way

# Preview
cd apps/web && npm run preview  # Preview production build
cd apps/web && npm run serve    # Serve on port 5173
```

### Backend (apps/api/)
```bash
# Development
npm run dev:api            # Start Flask backend (port 5000)
cd apps/api && py app.py   # Alternative way

# Production
npm run start              # Start Flask in production mode
```

### Full Stack Development
```bash
npm run dev               # Start frontend only (default)
npm run dev:full          # Start both frontend and backend concurrently
```

## Architecture Overview

CASIRA Connect is a full-stack social platform built with **Hexagonal Architecture** that has been completely refactored from a 2,528-line monolithic App.jsx to a clean, modular structure.

### Project Structure
```
apps/
├── web/              # React + Vite Frontend
│   ├── src/
│   │   ├── domain/          # Business entities and domain services
│   │   ├── application/     # Use cases and application ports
│   │   ├── infrastructure/  # API adapters and UI implementations
│   │   ├── shared/          # Utilities and dependency injection
│   │   └── components/      # React components (preserved original design)
│   └── package.json
└── api/              # Flask Python Backend
    ├── app.py           # Main Flask application
    └── requirements.txt
```

### Core Architecture Patterns
- **Hexagonal Architecture**: Clean separation between domain, application, and infrastructure layers
- **Repository Pattern**: Unified data access through `UnifiedAuthRepository`, `SupabaseUserRepository`, etc.
- **Dependency Injection**: Centralized through `DependencyContainer.js`
- **Event Bus**: Decoupled communication via `EventBus.js`
- **Provider Pattern**: React context management through `AppProvider.jsx`

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, React Router 7
- **Backend**: Flask 3.1, Gunicorn, Flask-CORS
- **Database**: Supabase PostgreSQL
- **Authentication**: Google OAuth + JWT
- **Deployment**: Vercel (frontend) + Render (backend)

## Key Features & Components

### User Roles & Dashboards
- **Admin**: `AdminDashboard.jsx` - Complete administration interface
- **Donors**: Dashboard with contribution analytics
- **Volunteers**: `VolunteerDashboard.jsx` - Activity and responsibility management
- **Visitors**: `VisitorDashboard.jsx` - Social exploration portal

### Core Functionality
- **Authentication**: `EnhancedLogin.jsx` with Google OAuth integration
- **Social Feed**: Posts, comments, likes system
- **Activities**: Create, manage, and join activities
- **Real-time Notifications**: Live update system
- **Responsive Design**: Mobile-first approach

## Environment Configuration

### Required Environment Variables (.env)
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT & Sessions
JWT_SECRET=your-jwt-secret-64-chars
SESSION_SECRET=your-session-secret-64-chars

# Backend URL
BACKEND_URL=https://your-app.onrender.com
```

## API Endpoints (Flask Backend)

### Authentication
- `POST /api/auth/login` - CASIRA native login
- `POST /api/auth/register` - User registration
- `POST /api/auth/google` - Google OAuth handler

### Data Management
- `GET/POST /api/posts` - Social posts CRUD
- `GET/POST /api/projects` - Project management
- `GET/PUT /api/users/profile` - User profile management
- `GET /api/health` - Health check endpoint

## Deployment

### Vercel (Frontend)
- Automatic deployment from main branch
- Configuration in `vercel.json`
- Build command: `npm run build`
- Live URL: https://proyecto-casira.vercel.app

### Render (Backend)
- Flask API deployment
- Configuration in root `render.yaml` (if exists)
- Environment variables managed through Render dashboard

### Important Notes
- **Monorepo Structure**: Uses npm workspaces for `apps/web` and `apps/api`
- **Node Version**: Specified as 20.x in engines (Vercel uses Node 22.x)
- **Build Process**: Frontend builds from `apps/web/` with Vite
- **CORS Configuration**: Backend configured for multiple frontend origins

## Common Development Tasks

### Adding New Features
1. Create domain entities in `src/domain/entities/`
2. Define use cases in `src/application/usecases/`
3. Implement repositories in `src/infrastructure/api/`
4. Add UI components following existing patterns
5. Update `AppProvider.jsx` for state management

### Debugging Build Issues
- Check that dependencies are installed in correct workspace (`apps/web/` vs root)
- Verify environment variables are properly configured
- Use `npm run build:render` for detailed build logging

### Database Operations
- Use Supabase dashboard for schema changes
- Repository pattern abstracts database operations
- `UnifiedAuthRepository.js` handles authentication data access

## Code Quality Standards

### React Components
- Functional components with hooks
- Proper prop destructuring
- Error boundaries for robust error handling
- Lazy loading for performance optimization

### State Management
- Context API through `AppProvider.jsx`
- Local storage integration for persistence
- Event-driven architecture for component communication

### Backend Patterns
- Flask blueprints for route organization
- Proper CORS configuration
- Environment-based configuration management

The codebase has been transformed from a 2,528-line monolithic structure to a clean, maintainable hexagonal architecture while preserving the exact original design and functionality.