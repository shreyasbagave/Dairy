import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

function AddMilkEntryForm() {
  const [form, setForm] = useState({
    farmer_id: '',
    date: new Date().toISOString().split('T')[0],
    session: 'Morning',
    quantity_liters: '',
    fat_percent: '',
    rate_per_liter: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    fetchFarmers();
  }, []);

  useEffect(() => {
    // Calculate total cost when quantity or rate changes
    if (form.quantity_liters && form.rate_per_liter) {
      const total = parseFloat(form.quantity_liters) * parseFloat(form.rate_per_liter);
      setTotalCost(total);
    } else {
      setTotalCost(0);
    }
  }, [form.quantity_liters, form.rate_per_liter]);

  const fetchFarmers = async () => {
    try {
      const response = await apiCall('/admin/farmers', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setFarmers(data);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await apiCall('/admin/add-milk-log', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          quantity_liters: parseFloat(form.quantity_liters),
          fat_percent: parseFloat(form.fat_percent),
          rate_per_liter: parseFloat(form.rate_per_liter)
        })
      });

      if (response.ok) {
        setMessage('Milk entry added successfully!');
        setForm({
          farmer_id: '',
          date: new Date().toISOString().split('T')[0],
          session: 'Morning',
          quantity_liters: '',
          fat_percent: '',
          rate_per_liter: ''
        });
        setTotalCost(0);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to add milk entry');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error adding milk entry:', error);
    }

    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: '100%',
      padding: 'clamp(16px, 4vw, 24px)'
    }}>
      <h1 style={{
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        marginBottom: 'clamp(20px, 5vw, 32px)',
        color: '#2d3748',
        textAlign: 'center'
      }}>
        🥛 Add Milk Entry
      </h1>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: 'clamp(20px, 5vw, 32px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 4vw, 24px)'
        }}>
          {/* Farmer Selection */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Farmer *
            </label>
            <select
              name="farmer_id"
              value={form.farmer_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              <option value="">Select a farmer</option>
              {farmers.map(farmer => (
                <option key={farmer.farmer_id} value={farmer.farmer_id}>
                  {farmer.farmer_id} - {farmer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Session */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(12px, 3vw, 16px)'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2d3748',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}>
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2d3748',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}>
                Session *
              </label>
              <select
                name="session"
                value={form.session}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>

          {/* Quantity and Fat */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(12px, 3vw, 16px)'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2d3748',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}>
                Quantity (Liters) *
              </label>
              <input
                type="number"
                name="quantity_liters"
                value={form.quantity_liters}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter quantity in liters"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2d3748',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}>
                Fat Percentage *
              </label>
              <input
                type="number"
                name="fat_percent"
                value={form.fat_percent}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter fat percentage"
              />
            </div>
          </div>

          {/* Rate and Total */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(12px, 3vw, 16px)'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2d3748',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}>
                Rate per Liter (₹) *
              </label>
              <input
                type="number"
                name="rate_per_liter"
                value={form.rate_per_liter}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  minHeight: '44px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter rate per liter"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2d3748',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}>
                Total Cost (₹)
              </label>
              <input
                type="text"
                value={`₹${totalCost.toFixed(2)}`}
                readOnly
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f8f9fa',
                  color: '#2d3748',
                  fontWeight: '600'
                }}
              />
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div style={{
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '8px',
              backgroundColor: message.includes('success') ? '#f0fdf4' : '#fef2f2',
              color: message.includes('success') ? '#059669' : '#dc2626',
              border: `1px solid ${message.includes('success') ? '#bbf7d0' : '#fecaca'}`,
              fontSize: 'clamp(14px, 3vw, 16px)',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 'clamp(12px, 3vw, 16px)',
              background: loading ? '#9ca3af' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              minHeight: '48px'
            }}
          >
            {loading ? 'Adding Entry...' : 'Add Milk Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddMilkEntryForm; 