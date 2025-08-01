import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [tokenValid, setTokenValid] = useState(false);

  const token = searchParams.get('token');
  const role = searchParams.get('role');

  useEffect(() => {
    if (!token) {
      setMessage('Invalid reset link. Missing token.');
      setVerifying(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await apiCall(`/verify-reset-token/${token}`, {
        method: 'GET',
      });

      const data = await res.json();

      if (res.ok) {
        setTokenValid(true);
        setUserInfo(data);
        setMessage('');
      } else {
        setTokenValid(false);
        setMessage(data.message || 'Invalid or expired reset token');
      }
    } catch (err) {
      setTokenValid(false);
      setMessage(err.message || 'Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await apiCall('/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setMessage(err.message || 'Network error. Please try again.');
    }

    setLoading(false);
  };

  if (verifying) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f7fafc'
      }}>
        <div style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>⏳</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
            Verifying Reset Link
          </h2>
          <p style={{ margin: 0, color: '#718096' }}>
            Please wait while we verify your reset token...
          </p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f7fafc'
      }}>
        <div style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: 400
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>
            Invalid Reset Link
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#718096' }}>
            {message}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#4299e1',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f7fafc'
    }}>
      <div style={{
        background: '#fff',
        padding: 32,
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: 400,
        width: '90%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
            Reset Password
          </h2>
          <p style={{ margin: 0, color: '#718096' }}>
            Set a new password for {userInfo?.username} ({userInfo?.role})
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              New Password:
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 16
              }}
              placeholder="Enter new password"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Confirm New Password:
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                fontSize: 16
              }}
              placeholder="Confirm new password"
            />
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

          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between'
          }}>
            <button
              type="button"
              onClick={() => navigate('/')}
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
              Cancel
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 