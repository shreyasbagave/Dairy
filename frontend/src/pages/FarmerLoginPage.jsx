import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, setAuthToken } from '../utils/api';

function FarmerLoginPage() {
  const [form, setForm] = useState({
    farmer_id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await apiCall('/farmer-auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        
        // Check if this is first-time login
        if (data.is_first_login) {
          // Store farmer info temporarily for password setup
          localStorage.setItem('farmerInfo', JSON.stringify({
            farmer_id: data.farmer_id,
            farmer_name: data.farmer_name,
            admin_id: data.admin_id
          }));
          navigate('/farmer/set-password');
        } else {
          // Regular login - go to dashboard
          localStorage.setItem('farmerInfo', JSON.stringify({
            farmer_id: data.farmer_id,
            farmer_name: data.farmer_name,
            admin_id: data.admin_id
          }));
          navigate('/farmer/dashboard');
        }
      } else {
        const errorData = await res.json();
        setMessage(errorData.message || 'Login failed');
      }
    } catch (err) {
      console.error('Farmer login error:', err);
      setMessage(err.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(10px, 3vw, 20px)',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: 'clamp(20px, 5vw, 32px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: 'clamp(300px, 90vw, 400px)',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
          <h1 style={{ 
            color: '#2d3748', 
            marginBottom: '8px',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600'
          }}>
            🐄 Farmer Login
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            margin: 0
          }}>
            Access your milk records
          </p>
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            color: '#92400e'
          }}>
            <strong>First-time login:</strong> Use password "12345678"
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'clamp(12px, 3vw, 16px)',
          width: '100%'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Farmer ID
            </label>
            <input
              type="text"
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
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                minHeight: '44px'
              }}
              placeholder="Enter your Farmer ID"
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
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                minHeight: '44px'
              }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 'clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)',
              background: loading ? '#9ca3af' : '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '8px',
              minHeight: '48px'
            }}
          >
            {loading ? 'Logging in...' : 'Login as Farmer'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: 'clamp(12px, 3vw, 16px)',
            padding: 'clamp(8px, 2vw, 12px)',
            borderRadius: '8px',
            backgroundColor: message.includes('error') || message.includes('Failed') || message.includes('Invalid') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('error') || message.includes('Failed') || message.includes('Invalid') ? '#dc2626' : '#059669',
            textAlign: 'center',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            border: `1px solid ${message.includes('error') || message.includes('Failed') || message.includes('Invalid') ? '#fecaca' : '#bbf7d0'}`
          }}>
            {message}
          </div>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: 'clamp(16px, 4vw, 24px)',
          paddingTop: 'clamp(16px, 4vw, 24px)',
          borderTop: '1px solid #e2e8f0'
        }}>
          <p style={{ 
            color: '#718096', 
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            margin: '0 0 8px 0'
          }}>
            New farmer?
          </p>
          <button
            onClick={() => navigate('/farmer/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              textDecoration: 'underline',
              padding: '4px 8px',
              marginRight: '16px'
            }}
          >
            Create Account
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              textDecoration: 'underline',
              padding: '4px 8px'
            }}
          >
            Back to Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmerLoginPage;
