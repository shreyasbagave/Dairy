import React, { useState } from 'react';
import { apiCall } from '../utils/api';

const ForgotPassword = ({ onClose, onShowLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    role: 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      setMessage('Please enter your username');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await apiCall('/request-password-reset', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset link generated successfully!');
        setResetLink(data.resetLink);
      } else {
        setMessage(data.message || 'Failed to generate reset link');
      }
    } catch (err) {
      setMessage(err.message || 'Network error. Please try again.');
    }

    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetLink);
    setMessage('Reset link copied to clipboard!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        maxWidth: 500,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h2 style={{ margin: 0, color: '#2d3748' }}>🔐 Forgot Password</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#718096'
            }}
          >
            ×
          </button>
        </div>

        <p style={{ color: '#718096', marginBottom: 24 }}>
          Enter your username and role to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Username:
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 16
              }}
              placeholder="Enter your username"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Role:
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 16
              }}
            >
              <option value="admin">Admin</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>

          {message && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 6,
              background: message.includes('successfully') ? '#c6f6d5' : '#fed7d7',
              color: message.includes('successfully') ? '#22543d' : '#c53030'
            }}>
              {message}
            </div>
          )}

          {resetLink && (
            <div style={{
              padding: 16,
              marginBottom: 16,
              background: '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Reset Link:</p>
              <div style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={resetLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: 8,
                    border: '1px solid #e2e8f0',
                    borderRadius: 4,
                    fontSize: 12,
                    background: '#f1f5f9'
                  }}
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px 12px',
                    background: '#4299e1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  Copy
                </button>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#718096' }}>
                Click the link to reset your password. Link expires in 1 hour.
              </p>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between'
          }}>
            <button
              type="button"
              onClick={onShowLogin}
              style={{
                background: '#718096',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#a0aec0' : '#38a169',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {loading ? 'Generating...' : 'Generate Reset Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 