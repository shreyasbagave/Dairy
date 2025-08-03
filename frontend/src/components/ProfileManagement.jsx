import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

const ProfileManagement = ({ isOpen, onClose }) => {
  const [adminInfo, setAdminInfo] = useState({ username: '', role: 'admin' });
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
    // Get admin info from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setAdminInfo({
          username: payload.userId || 'Admin',
          role: payload.role || 'admin'
        });
      } catch (err) {
        console.error('Error parsing token:', err);
        setAdminInfo({ username: 'Admin', role: 'admin' });
      }
    }
  }, []);

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
      const response = await apiCall('/admin/change-password', {
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
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error changing password:', error);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

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
          <h2 style={{ margin: 0, color: '#2d3748' }}>👤 Profile Management</h2>
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

        {/* Profile Info */}
        <div style={{
          background: '#f7fafc',
          padding: 20,
          borderRadius: 8,
          marginBottom: 24
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2d3748' }}>Account Information</h3>
          <div style={{ marginBottom: 8 }}>
            <strong>Username:</strong> {adminInfo.username}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Role:</strong> {adminInfo.role.toUpperCase()}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Status:</strong> <span style={{ color: '#38a169' }}>● Active</span>
          </div>
        </div>

        {/* Change Password Section */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            style={{
              background: '#4299e1',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: 16
            }}
          >
            {showChangePassword ? 'Cancel Password Change' : '🔐 Change Password'}
          </button>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} style={{
              background: '#f7fafc',
              padding: 20,
              borderRadius: 8
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
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
                    padding: 8,
                    border: '1px solid #e2e8f0',
                    borderRadius: 4
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
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
                    padding: 8,
                    border: '1px solid #e2e8f0',
                    borderRadius: 4
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
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
                    padding: 8,
                    border: '1px solid #e2e8f0',
                    borderRadius: 4
                  }}
                />
              </div>
              {message && (
                <div style={{
                  padding: 8,
                  marginBottom: 16,
                  borderRadius: 4,
                  background: message.includes('successfully') ? '#c6f6d5' : '#fed7d7',
                  color: message.includes('successfully') ? '#22543d' : '#c53030'
                }}>
                  {message}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#a0aec0' : '#38a169',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 6,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
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
            Close
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: '#e53e3e',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement; 