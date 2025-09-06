import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, setAuthToken } from '../utils/api';

function SetInitialPassword() {
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Client-side validation
    if (form.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await apiCall('/farmer-auth/set-initial-password', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        // Store farmer info in localStorage
        localStorage.setItem('farmerInfo', JSON.stringify({
          farmer_id: data.farmer_id,
          farmer_name: data.farmer_name,
          admin_id: data.admin_id
        }));
        navigate('/farmer/dashboard');
      } else {
        const errorData = await res.json();
        setMessage(errorData.message || 'Failed to set password');
      }
    } catch (err) {
      console.error('Set password error:', err);
      setMessage(err.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear message when user starts typing
    if (message) setMessage('');
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: 'Weak', color: '#dc2626' };
    if (password.length < 8) return { strength: 2, text: 'Fair', color: '#f59e0b' };
    if (password.length >= 8) return { strength: 3, text: 'Strong', color: '#059669' };
  };

  const passwordStrength = getPasswordStrength(form.newPassword);

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
            🔐 Set Your Password
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            margin: 0
          }}>
            Create a secure password for your account
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
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  paddingRight: 'clamp(40px, 8vw, 50px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  minHeight: '44px'
                }}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#718096',
                  fontSize: '18px'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {form.newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                }}>
                  <span style={{ color: '#718096' }}>Strength:</span>
                  <span style={{ color: passwordStrength.color, fontWeight: '500' }}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: '#e2e8f0',
                  borderRadius: '2px',
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength.strength / 3) * 100}%`,
                    height: '100%',
                    background: passwordStrength.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                  paddingRight: 'clamp(40px, 8vw, 50px)',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  minHeight: '44px'
                }}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#718096',
                  fontSize: '18px'
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <div style={{
                marginTop: '4px',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                color: '#dc2626'
              }}>
                Passwords do not match
              </div>
            )}
            {form.confirmPassword && form.newPassword === form.confirmPassword && form.newPassword.length > 0 && (
              <div style={{
                marginTop: '4px',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                color: '#059669'
              }}>
                ✓ Passwords match
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || form.newPassword !== form.confirmPassword || form.newPassword.length < 6}
            style={{
              width: '100%',
              padding: 'clamp(12px, 3vw, 14px) clamp(16px, 4vw, 20px)',
              background: loading || form.newPassword !== form.confirmPassword || form.newPassword.length < 6 ? '#9ca3af' : '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '600',
              cursor: loading || form.newPassword !== form.confirmPassword || form.newPassword.length < 6 ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '8px',
              minHeight: '48px'
            }}
          >
            {loading ? 'Setting Password...' : 'Set Password & Continue'}
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
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            color: '#718096',
            margin: 0
          }}>
            Password must be at least 6 characters long
          </p>
        </div>
      </div>
    </div>
  );
}

export default SetInitialPassword;
