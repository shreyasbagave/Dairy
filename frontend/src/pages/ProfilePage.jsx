import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function ProfilePage() {
  const [userInfo, setUserInfo] = useState({ username: '', role: '' });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Get user info from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo({
          username: payload.userId || 'User',
          role: payload.role || 'user'
        });
      } catch (err) {
        console.error('Error parsing token:', err);
        setUserInfo({ username: 'User', role: 'user' });
      }
    } else {
      // Redirect to login if no token
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await apiCall('/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setMessage('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to change password');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
      console.error('Error changing password:', err);
    }

    setLoading(false);
  };

  const goBack = () => {
    if (userInfo.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/farmer/dashboard');
    }
  };

  return (
    <div style={{
      maxWidth: '100%',
      padding: 'clamp(16px, 4vw, 24px)',
      minHeight: '100vh',
      background: '#f7fafc'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '12px',
        padding: 'clamp(20px, 5vw, 32px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'clamp(20px, 5vw, 32px)',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: 'clamp(12px, 3vw, 16px)'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            margin: 0,
            color: '#2d3748'
          }}>
            👤 Profile Management
          </h1>
          <button
            onClick={goBack}
            style={{
              background: '#718096',
              color: '#fff',
              border: 'none',
              padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 20px)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '600',
              minHeight: '44px'
            }}
          >
            ← Back
          </button>
        </div>

        {/* Profile Info */}
        <div style={{
          background: '#f8fafc',
          padding: 'clamp(16px, 4vw, 24px)',
          borderRadius: '12px',
          marginBottom: 'clamp(20px, 5vw, 32px)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            margin: '0 0 clamp(12px, 3vw, 16px) 0',
            color: '#2d3748'
          }}>
            Account Information
          </h3>
          <div style={{
            display: 'grid',
            gap: 'clamp(8px, 2vw, 12px)',
            fontSize: 'clamp(14px, 3vw, 16px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'clamp(8px, 2vw, 12px)',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <strong>Username:</strong>
              <span>{userInfo.username}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'clamp(8px, 2vw, 12px)',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <strong>Role:</strong>
              <span style={{ textTransform: 'uppercase' }}>{userInfo.role}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 'clamp(8px, 2vw, 12px)',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <strong>Status:</strong>
              <span style={{ color: '#059669', fontWeight: '600' }}>● Active</span>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div style={{ marginBottom: 'clamp(20px, 5vw, 32px)' }}>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: 'clamp(12px, 3vw, 16px) clamp(20px, 4vw, 24px)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: 'clamp(14px, 3vw, 16px)',
              minHeight: '48px',
              width: '100%',
              marginBottom: 'clamp(12px, 3vw, 16px)'
            }}
          >
            {showChangePassword ? 'Cancel Password Change' : '🔐 Change Password'}
          </button>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} style={{
              background: '#f8fafc',
              padding: 'clamp(16px, 4vw, 24px)',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#2d3748',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  Current Password:
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
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
              <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#2d3748',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  New Password:
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
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
              <div style={{ marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#2d3748',
                  fontSize: 'clamp(14px, 3vw, 16px)'
                }}>
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
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
              {message && (
                <div style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  marginBottom: 'clamp(12px, 3vw, 16px)',
                  borderRadius: '8px',
                  background: message.includes('successfully') ? '#f0fdf4' : '#fef2f2',
                  color: message.includes('successfully') ? '#059669' : '#dc2626',
                  border: `1px solid ${message.includes('successfully') ? '#bbf7d0' : '#fecaca'}`,
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  textAlign: 'center'
                }}>
                  {message}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#9ca3af' : '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: 'clamp(12px, 3vw, 16px)',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  minHeight: '48px',
                  width: '100%'
                }}
              >
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gap: 'clamp(12px, 3vw, 16px)',
          gridTemplateColumns: '1fr 1fr'
        }}>
          <button
            onClick={goBack}
            style={{
              background: '#718096',
              color: '#fff',
              border: 'none',
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: 'clamp(14px, 3vw, 16px)',
              minHeight: '48px'
            }}
          >
            Close
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: 'clamp(12px, 3vw, 16px)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: 'clamp(14px, 3vw, 16px)',
              minHeight: '48px'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 