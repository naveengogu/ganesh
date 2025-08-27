import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './styles.css';
import AddPage from './pages/AddPage';
import ViewPage from './pages/ViewPage';

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Velampata</h1>
          <nav className="flex gap-4 text-sm">
            <Link to="/add" className="hover:text-blue-600">Add</Link>
            <Link to="/view" className="hover:text-blue-600">View</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/add" element={<AddPage />} />
          <Route path="/view" element={<ViewPage />} />
          <Route path="*" element={<Navigate to="/add" replace />} />
        </Routes>
      </main>
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