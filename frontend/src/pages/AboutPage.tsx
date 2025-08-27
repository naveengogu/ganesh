import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Velampata</h1>
          <p className="text-xl text-gray-600 mb-8">Multi-tenant Voice-Enabled Item Management System</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">For Tenants</h2>
            <p className="text-gray-600 mb-4">
              Easy-to-use interface to add and manage items with voice feedback. 
              Each tenant gets their own dedicated space with unique URL.
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Add items with name and amount</li>
              <li>• Voice synthesis with Indian female accent</li>
              <li>• Real-time updates across devices</li>
              <li>• No login required for tenants</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">For Administrators</h2>
            <p className="text-gray-600 mb-4">
              Complete control over tenant management with a powerful admin dashboard.
            </p>
            <ul className="text-gray-600 space-y-2">
              <li>• Create and manage tenants</li>
              <li>• Generate unique tenant URLs</li>
              <li>• Monitor tenant activity</li>
              <li>• Secure admin authentication</li>
            </ul>
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/admin/login" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Admin Login
              </Link>
              <div className="text-gray-500 px-6 py-3">
                Contact admin for tenant access
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>Built with React, Node.js, PostgreSQL, and Docker</p>
        </div>
      </div>
    </div>
  );
} 