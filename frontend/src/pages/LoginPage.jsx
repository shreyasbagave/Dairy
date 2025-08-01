import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPassword from '../components/ForgotPassword';
import { apiCall, setAuthToken } from '../utils/api';

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? '/login' : (form.role === 'admin' ? '/signup-admin' : '/signup-farmer');
      const res = await apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        if (form.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/farmer/dashboard');
        }
      } else {
        const errorData = await res.json();
        setMessage(errorData.message || 'Failed to authenticate');
      }
    } catch (err) {
      setMessage(err.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (showForgotPassword) {
    return <ForgotPassword onClose={() => setShowForgotPassword(false)} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            color: '#2d3748', 
            marginBottom: '8px',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)'
          }}>
            🥛 Dairy Management
          </h1>
          <p style={{ color: '#718096', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              {isLogin ? 'Username/Email' : 'Username'}
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder={isLogin ? "Enter username or email" : "Choose a username"}
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
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your password"
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
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="admin">Admin</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '8px',
              minHeight: '48px'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                textDecoration: 'underline'
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}

        {message && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: message.includes('error') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('error') ? '#dc2626' : '#059669',
            textAlign: 'center',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
          }}>
            {message}
          </div>
        )}

        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setForm({ username: '', password: '', role: 'admin' });
              setMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 