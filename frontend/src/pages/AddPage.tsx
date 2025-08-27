import React, { useEffect, useMemo, useState } from 'react';

type Item = {
  id: number;
  name: string;
  amount: number;
  created_at: string;
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function AddPage() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

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
  }, []);

  // Load and choose a female voice when available
  useEffect(() => {
    if (!canSpeak) return;

    function choosePreferred(available: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
      if (!available || available.length === 0) return null;
      const byScore = available
        .map(v => {
          const name = (v.name || '').toLowerCase();
          const lang = (v.lang || '').toLowerCase();
          let score = 0;
          // Strong preference: Telugu
          if (lang.startsWith('te')) score += 200;
          if (name.includes('te') || name.includes('telugu')) score += 50;
          // Next: Hindi India or English India
          if (lang.includes('hi-in')) score += 20;
          if (lang.includes('en-in') || name.includes('india')) score += 10;
          // Strong preference for female voices
          if (name.includes('female') || name.includes('padma') || name.includes('swara') || name.includes('neural')) score += 100;
          if (name.includes('woman') || name.includes('girl') || name.includes('siri') || name.includes('alexa')) score += 80;
          // General Google/Microsoft higher quality
          if (name.includes('google') || name.includes('microsoft')) score += 10;
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
    setError(null);
    const amountNum = Number(amount);
    if (!name.trim() || !Number.isFinite(amountNum)) {
      setError('Enter valid name and amount');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), amount: amountNum })
      });
      if (!res.ok) throw new Error('Request failed');
      setName('');
      setAmount('');
      await fetchItems();
    } catch (e) {
      setError('Failed to add item');
    }
  };

  const englishCounter = (n: number) => {
    if (n === 1) return '1st time';
    if (n === 2) return '2nd time';
    if (n === 3) return '3rd time';
    return '';
  };

  const toTeluguDigits = (n: number) => {
    try {
      return n.toLocaleString('te-IN');
    } catch {
      return String(n);
    }
  };

  const speak = (item: Item, n: number) => {
    if (!canSpeak) return;
    const counter = englishCounter(n);
    const amountTe = toTeluguDigits(item.amount);
    const text = `${item.name} ${amountTe} రూపాయలు ${counter}`;
    const utter = new SpeechSynthesisUtterance(text);
    // Strong Telugu hints + slower rate
    utter.rate = 0.7;
    utter.pitch = 1.0;
    utter.lang = 'te-IN';
    if (preferredVoice) {
      utter.voice = preferredVoice;
      if (preferredVoice.lang) utter.lang = preferredVoice.lang;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  return (
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan={3}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-3" colSpan={3}>No items yet</td></tr>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 