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
npm run dev:api            # Start Flask backend (port 3000)
cd apps/api && py app.py   # Alternative way (runs on port 3000)

# Production
npm run start              # Start Flask in production mode
```

### Full Stack Development
```bash
npm run dev               # Start ONLY frontend (port 5173)
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
  - Domain: Business entities (`User.js`, `Post.js`, `Activity.js`)
  - Application: Use cases (`LoginUser.js`, `GetDashboardData.js`) and ports (repository interfaces)
  - Infrastructure: Implementations (`SupabaseUserRepository.js`, `UnifiedAuthRepository.js`, `HttpApiRepository.js`)
- **Repository Pattern**: Unified data access through `UnifiedAuthRepository`, `SupabaseUserRepository`, etc.
- **Dependency Injection**: Centralized through `DependencyContainer.js` (singleton pattern with factory registration)
- **Event Bus**: Decoupled communication via `EventBus.js` with domain events
- **Provider Pattern**: React context management through `AppProvider.jsx` (combines AuthContext, NotificationContext, AppContext)

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
- **Dual Authentication System**:
  - CASIRA Native: Email/password via `/api/auth/login` and `/api/auth/register`
  - Google OAuth: Handled by `unified-google-auth.service.js`
  - Both systems produce identical JWT tokens and user objects
- **Social Feed**: Posts, comments, likes system
- **Activities**: Create, manage, and join activities
- **Real-time Notifications**: Live update system via `realtime-role-change.service.js` and `broadcast-role-change.service.js`
- **Role Management**: Admin can change user roles with real-time cross-tab notifications
- **Responsive Design**: Mobile-first approach with `MobileTabNavigation.jsx`

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
- `POST /api/auth/login` - CASIRA native login (email/password)
- `POST /api/auth/register` - User registration with automatic login
- `POST /api/auth/check-email` - Check if email exists (for registration validation)
- `POST /api/auth/google` - Google OAuth handler (placeholder)

### Data Management
- `GET /api/posts` - Get all posts with comments and likes
- `POST /api/posts` - Create new post
- `POST /api/posts/<id>/like` - Toggle like on post
- `GET /api/posts/<id>/comments` - Get post comments
- `POST /api/posts/<id>/comments` - Add comment to post
- `POST /api/posts/<id>/comments/<comment_id>/like` - Toggle like on comment
- `GET /api/projects` - Get all projects
- `GET /api/projects/featured` - Get featured projects
- `GET /api/projects/stats` - Get project statistics
- `POST /api/users/profile` - Update user profile
- `GET /api/health` - Health check endpoint

## Deployment

### Vercel (Frontend)
- Automatic deployment from main branch
- Configuration in `vercel.json`
- Build command: `npm run build`
- Live URL: https://proyecto-casira.vercel.app

### Render (Backend)
- Flask API deployment on Render
- Environment variables managed through Render dashboard
- Backend URL: https://proyecto-casira.onrender.com

### Important Notes
- **Monorepo Structure**: Uses npm workspaces for `apps/web` and `apps/api`
- **Node Version**: Specified as 20.x in root package.json engines
- **Build Process**: Frontend builds from `apps/web/` with Vite
- **CORS Configuration**: Backend configured for multiple origins (Vercel, Render, localhost)
- **Authentication Storage**: Passwords stored as bcrypt hashes in user bio field (format: `CASIRA_PWD:hash|actual_bio`)
- **JWT Tokens**: 7-day expiration for both CASIRA and Google OAuth sessions

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

### Troubleshooting Common Issues

#### Backend 500 Errors on Login
- Check Render logs for Python exceptions
- Verify Supabase credentials are correctly set in Render environment variables
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are valid
- Check that user's bio field contains password hash in correct format: `CASIRA_PWD:hash|bio_text`
- Common cause: Missing or invalid bcrypt hash in user bio field

#### Particles.js Errors
- Known issue: `particles.js` may fail to load in production builds
- Error: "TypeError: o is not a function" - safe to ignore, doesn't affect functionality
- Component: `ParticlesBackground.jsx` - consider lazy loading or removing if problematic

#### Cross-Tab Role Changes Not Working
- Ensure `realtime-role-change.service.js` is initialized in `AppProvider.jsx`
- Check browser console for WebSocket connection errors
- Verify Supabase Realtime is enabled for `users` table
- localStorage key: `casira-current-user` should update immediately

### Database Operations
- Use Supabase dashboard for schema changes
- Repository pattern abstracts database operations
- `UnifiedAuthRepository.js` handles authentication data access
- User passwords stored in `bio` field as: `CASIRA_PWD:bcrypt_hash|actual_bio_content`

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