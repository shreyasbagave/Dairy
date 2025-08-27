import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

function FeedManagement() {
  const [farmers, setFarmers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    farmerId: '',
    date: new Date().toISOString().slice(0, 10),
    quantity: '',
    price: ''
  });

  useEffect(() => {
    fetchFarmers();
    fetchPurchases();
  }, []);

  const fetchFarmers = async () => {
    setError('');
    try {
      const response = await apiCall('/admin/farmers', { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setFarmers(data);
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch farmers');
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiCall('/api/feed/purchases', { method: 'GET' });
      const data = await response.json();
      if (data.success) {
        setPurchases(data.purchases || []);
      } else {
        setError(data.message || 'Failed to load purchases');
      }
    } catch (e) {
      setError(e.message || 'Failed to load purchases');
    }
    setLoading(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.farmerId || !form.date || !form.quantity || !form.price) {
      setError('Please fill all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiCall(`/api/feed/purchases/${form.farmerId}`, {
        method: 'POST',
        body: JSON.stringify({
          date: form.date,
          quantity: parseFloat(form.quantity),
          price: parseFloat(form.price)
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('Feed purchase recorded');
        setForm({ farmerId: '', date: new Date().toISOString().slice(0, 10), quantity: '', price: '' });
        fetchPurchases();
      } else {
        setError(data.message || 'Failed to save purchase');
      }
    } catch (e) {
      setError(e.message || 'Failed to save purchase');
    }
    setLoading(false);
  };

  const getFarmerName = (farmerId) => {
    const f = farmers.find(x => x.farmer_id === farmerId);
    return f ? `${f.farmer_id} - ${f.name}` : farmerId;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">🌾 Feed Management</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Farmer *</label>
            <select
              value={form.farmerId}
              onChange={(e) => handleChange('farmerId', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select farmer...</option>
              {farmers.map(f => (
                <option key={f.farmer_id} value={f.farmer_id}>{f.farmer_id} - {f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>

          

          <div>
            <label className="block text-sm font-medium mb-1">Quantity *</label>
            <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => handleChange('quantity', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., 10" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price (₹) *</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => handleChange('price', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., 1500" />
          </div>
        </div>

        <div className="flex justify-end mt-4 md:mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md w-full disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Purchase'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Feed Purchases</h2>
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map(p => (
                  <tr key={p._id}>
                    <td className="px-4 py-2 text-sm">{getFarmerName(p.farmer_id)}</td>
                    <td className="px-4 py-2 text-sm">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm">{p.quantity}</td>
                    <td className="px-4 py-2 text-sm">₹{Number(p.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchases.length === 0 && <div className="text-gray-600 py-6 text-center">No purchases found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedManagement;


