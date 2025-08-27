import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

type Item = {
  id: number;
  name: string;
  amount: number;
  last_button_clicked?: number;
  created_at: string;
};

type Tenant = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function TenantAddPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

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
  }, [tenantSlug]);

  // Load and choose an Indian female voice
  useEffect(() => {
    if (!canSpeak) return;

    function choosePreferred(available: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
      if (!available || available.length === 0) return null;
      const byScore = available
        .map(v => {
          const name = (v.name || '').toLowerCase();
          const lang = (v.lang || '').toLowerCase();
          let score = 0;
          
          // Strong preference for Indian English female voices
          if (name.includes('female') || name.includes('woman') || name.includes('girl')) score += 100;
          if (lang.includes('en-in') || name.includes('india') || name.includes('indian')) score += 80;
          if (name.includes('hindi') || lang.includes('hi-in')) score += 40;
          if (name.includes('telugu') || lang.includes('te-in')) score += 30;
          
          // Prefer neural/high-quality voices
          if (name.includes('neural') || name.includes('google') || name.includes('microsoft')) score += 30;
          
          return { v, score };
        })
        .sort((a, b) => b.score - a.score);
      return byScore[0]?.v ?? null;
    }

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      setPreferredVoice(choosePreferred(list));
    };

    loadVoices();
    if (voices.length === 0) {
      const handler = () => loadVoices();
      window.speechSynthesis.onvoiceschanged = handler;
      return () => {
        if (window.speechSynthesis.onvoiceschanged === handler) {
          window.speechSynthesis.onvoiceschanged = null as any;
        }
      };
    }
  }, [canSpeak]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount.trim()) return;
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum)) {
      setError('Amount must be a number');
      return;
    }
    
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/tenant/${tenantSlug}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), amount: amountNum })
      });
      
      if (res.ok) {
        const newItem = await res.json();
        setName('');
        setAmount('');
        await fetchItems();
        // Automatically play voice with button 1 when an item is added
        if (canSpeak && preferredVoice) {
          speak(newItem, 1);
        }
      } else {
        setError('Failed to add item');
      }
    } catch (e) {
      setError('Failed to add item');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/tenant/${tenantSlug}/items/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchItems();
      } else {
        setError('Failed to delete item');
      }
    } catch (e) {
      setError('Failed to delete item');
    }
  };

  const englishCounter = (n: number) => {
    if (n === 1) return '1st time';
    if (n === 2) return '2nd time';
    if (n === 3) return '3rd time';
    return '';
  };

  const speak = async (item: Item, n: number) => {
    if (!canSpeak) return;
    
    // Update the last button clicked in the backend
    try {
      await fetch(`${API_BASE}/tenant/${tenantSlug}/items/${item.id}/button`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttonNumber: n })
      });
    } catch (e) {
      console.error('Failed to update button clicked:', e);
    }
    
    const counter = englishCounter(n);
    const text = `${item.name} ... ${item.amount} rupees ... ${counter}`;
    const utter = new SpeechSynthesisUtterance(text);
    
    // Indian English female voice settings
    utter.rate = 0.75; // Slower for Indian accent
    utter.pitch = 1.15; // Slightly higher pitch for female voice
    utter.lang = 'en-IN'; // Indian English
    
    if (preferredVoice) {
      utter.voice = preferredVoice;
      // Keep Indian English even if voice has different lang
      if (preferredVoice.lang && preferredVoice.lang.includes('en-in')) {
        utter.lang = preferredVoice.lang;
      }
    }
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

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
              <Link to={`/t/${tenantSlug}/add`} className="text-blue-600 font-medium">Add</Link>
              <Link to={`/t/${tenantSlug}/view`} className="text-gray-600 hover:text-gray-900">View</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <form onSubmit={handleAdd} className="bg-white rounded-lg shadow p-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              className="border rounded px-3 py-2 sm:col-span-2"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Amount (INR)"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button className="bg-blue-600 text-white rounded px-4 py-2" type="submit">Add</button>
          </form>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="bg-white rounded-lg shadow overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Amount (₹)</th>
                  <th className="text-left p-3">Speak</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="p-3" colSpan={4}>Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td className="p-3" colSpan={4}>No items yet</td></tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="p-3">{it.name}</td>
                      <td className="p-3">{it.amount}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {[1,2,3].map((n) => (
                            <button
                              key={n}
                              onClick={() => speak(it, n)}
                              className="border rounded px-2 py-1 hover:bg-gray-50"
                            >{n}</button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(it.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
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