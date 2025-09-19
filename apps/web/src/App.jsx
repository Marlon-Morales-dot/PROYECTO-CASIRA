import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppProvider from './infrastructure/ui/providers/AppProvider.jsx';
import LandingPage from './infrastructure/ui/pages/LandingPage.jsx';

// Importar diagnósticos y auto-fix para debugging
import './lib/diagnostics.js';
import './lib/auto-fix.js';

// Importar componentes existentes (mantienen diseño exacto)
import AdminDashboard from './components/AdminDashboard.jsx';
import VolunteerDashboard from './components/VolunteerDashboard.jsx';
import SocialDashboard from './components/SocialDashboard.jsx';
import VisitorDashboard from './components/VisitorDashboard.jsx';
import PublicSocialView from './components/PublicSocialView.jsx';
import ProfessionalLogin from './components/ProfessionalLogin.jsx';
import DashboardWrapper from './components/DashboardWrapper.jsx';
import GlobalRoleChangeModal from './components/GlobalRoleChangeModal.jsx';

// Importar estilos originales
import './App.css';


function App() {
  return (
    <AppProvider>
      <Router>
        {/* <AuthRedirectHandler /> */}
        <GlobalRoleChangeModal />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<ProfessionalLogin />} />
          <Route path="/enhanced-login" element={<ProfessionalLogin />} />
          <Route path="/social" element={<PublicSocialView />} />
          <Route path="/activities" element={<PublicSocialView />} />
          <Route path="/visitor" element={<VisitorDashboard />} />

          {/* Rutas de dashboard (mantienen componentes originales) */}
          <Route path="/dashboard" element={<DashboardWrapper />} />
          <Route path="/admin/dashboard" element={<DashboardWrapper />} />
          <Route path="/admin" element={<DashboardWrapper />} />
          <Route path="/volunteer/dashboard" element={<DashboardWrapper />} />
          <Route path="/visitor/dashboard" element={<DashboardWrapper />} />

          {/* Catch-all: redirigir a landing */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;