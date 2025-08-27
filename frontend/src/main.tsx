import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import TenantAddPage from './pages/TenantAddPage';
import TenantViewPage from './pages/TenantViewPage';
import AboutPage from './pages/AboutPage';

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Routes>
        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* Tenant routes */}
        <Route path="/t/:tenantSlug/add" element={<TenantAddPage />} />
        <Route path="/t/:tenantSlug/view" element={<TenantViewPage />} />
        
        {/* Static pages */}
        <Route path="/about" element={<AboutPage />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/about" replace />} />
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
); 