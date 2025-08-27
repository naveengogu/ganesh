import React, { useEffect, useState } from 'react';

type Item = {
  id: number;
  name: string;
  amount: number;
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function ViewPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/items`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const id = setInterval(fetchItems, 5000);
    return () => clearInterval(id);
  }, []);

  return (
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
  );
} 