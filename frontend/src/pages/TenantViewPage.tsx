import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

type Item = {
  id: number;
  name: string;
  amount: number;
  created_at: string;
};

type Tenant = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function TenantViewPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = async () => {
    try {
      const res = await fetch(`${API_BASE}/tenant/${tenantSlug}`);
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
      } else {
        setError('Tenant not found');
      }
    } catch (e) {
      setError('Failed to load tenant');
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/tenant/${tenantSlug}/items`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
    fetchItems();
    const id = setInterval(fetchItems, 5000);
    return () => clearInterval(id);
  }, [tenantSlug]);

  if (error && error.includes('not found')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenant Not Found</h1>
          <p className="text-gray-600 mb-4">The tenant you're looking for doesn't exist.</p>
          <Link to="/about" className="text-blue-600 hover:text-blue-800">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{tenant?.name || 'Loading...'}</h1>
              {tenant?.description && (
                <p className="text-sm text-gray-600">{tenant.description}</p>
              )}
            </div>
            <nav className="flex gap-4 text-sm">
              <Link to={`/t/${tenantSlug}/add`} className="text-gray-600 hover:text-gray-900">Add</Link>
              <Link to={`/t/${tenantSlug}/view`} className="text-blue-600 font-medium">View</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Amount (₹)</th>
                  <th className="text-left p-3">When</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="p-3" colSpan={3}>Loading...</td></tr>
                ) : error ? (
                  <tr><td className="p-3 text-red-600" colSpan={3}>{error}</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="p-3" colSpan={3}>No items yet</td></tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="p-3">{it.name}</td>
                      <td className="p-3">{it.amount}</td>
                      <td className="p-3">{new Date(it.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 