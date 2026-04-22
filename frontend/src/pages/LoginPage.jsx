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
  const [showPassword, setShowPassword] = useState(false);
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
      console.error('Login error:', err);
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
            🥛 Dairy Management
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            margin: 0
          }}>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </p>
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
                padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                minHeight: '44px'
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  paddingRight: 'clamp(44px, 10vw, 52px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  minHeight: '44px'
                }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
                padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                backgroundColor: '#fff',
                cursor: 'pointer',
                minHeight: '44px'
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
              padding: 'clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)',
              background: loading ? '#9ca3af' : '#2563eb',
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
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {isLogin && (
          <div style={{ textAlign: 'center', marginTop: 'clamp(12px, 3vw, 16px)' }}>
            <button
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                textDecoration: 'underline',
                padding: '4px 8px'
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}

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
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setForm({ username: '', password: '', role: 'admin' });
              setShowPassword(false);
              setMessage('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              textDecoration: 'underline',
              padding: '4px 8px'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: 'clamp(12px, 3vw, 16px)',
          paddingTop: 'clamp(12px, 3vw, 16px)',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => navigate('/farmer/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#059669',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              textDecoration: 'underline',
              padding: '4px 8px'
            }}
          >
            🐄 Login as Farmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 