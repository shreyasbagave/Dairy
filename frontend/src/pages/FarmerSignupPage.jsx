import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall, setAuthToken } from '../utils/api';

function FarmerSignupPage() {
  const [form, setForm] = useState({
    farmer_id: '',
    name: '',
    phone: '',
    address: '',
    bank_details: {
      account_no: '',
      ifsc: ''
    },
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword from the data sent to server
      const { confirmPassword, ...signupData } = form;
      
      const res = await apiCall('/farmer-auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData)
      });

      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        
        // Store farmer info and navigate to dashboard
        localStorage.setItem('farmerInfo', JSON.stringify({
          farmer_id: data.farmer_id,
          farmer_name: data.farmer_name,
          admin_id: data.admin_id
        }));
        
        setMessage('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/farmer/dashboard');
        }, 1500);
      } else {
        const errorData = await res.json();
        setMessage(errorData.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Farmer signup error:', err);
      setMessage(err.message || 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bank_')) {
      const bankField = name.replace('bank_', '');
      setForm({
        ...form,
        bank_details: {
          ...form.bank_details,
          [bankField]: value
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
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
        maxWidth: 'clamp(400px, 90vw, 500px)',
        margin: '0 auto',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 32px)' }}>
          <h1 style={{ 
            color: '#2d3748', 
            marginBottom: '8px',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600'
          }}>
            🐄 Farmer Registration
          </h1>
          <p style={{ 
            color: '#718096', 
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            margin: 0
          }}>
            Create your account to start logging milk records
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'clamp(12px, 3vw, 16px)',
          width: '100%'
        }}>
          {/* Farmer ID */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Farmer ID *
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
              placeholder="Enter unique Farmer ID"
            />
          </div>

          {/* Name */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
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
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
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
              placeholder="Enter your phone number"
            />
          </div>

          {/* Address */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Address *
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              style={{
                width: '100%',
                padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: '80px'
              }}
              placeholder="Enter your complete address"
            />
          </div>

          {/* Bank Details */}
          <div style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: 'clamp(12px, 3vw, 16px)',
            backgroundColor: '#f8fafc'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: '#2d3748', 
              fontSize: 'clamp(1rem, 3vw, 1.125rem)',
              fontWeight: '600'
            }}>
              Bank Details *
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '500',
                  color: '#4a5568',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                }}>
                  Account Number
                </label>
                <input
                  type="text"
                  name="bank_account_no"
                  value={form.bank_details.account_no}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: 'clamp(14px, 3vw, 16px)',
                    boxSizing: 'border-box',
                    minHeight: '40px'
                  }}
                  placeholder="Enter account number"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '500',
                  color: '#4a5568',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                }}>
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="bank_ifsc"
                  value={form.bank_details.ifsc}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: 'clamp(14px, 3vw, 16px)',
                    boxSizing: 'border-box',
                    minHeight: '40px'
                  }}
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Password *
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
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#2d3748',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}>
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
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
              placeholder="Confirm your password"
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
            {loading ? 'Creating Account...' : 'Create Account & Login'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: 'clamp(12px, 3vw, 16px)',
            padding: 'clamp(8px, 2vw, 12px)',
            borderRadius: '8px',
            backgroundColor: message.includes('error') || message.includes('Failed') || message.includes('Invalid') || message.includes('match') ? '#fef2f2' : '#f0fdf4',
            color: message.includes('error') || message.includes('Failed') || message.includes('Invalid') || message.includes('match') ? '#dc2626' : '#059669',
            textAlign: 'center',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            border: `1px solid ${message.includes('error') || message.includes('Failed') || message.includes('Invalid') || message.includes('match') ? '#fecaca' : '#bbf7d0'}`
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
            Already have an account?
          </p>
          <button
            onClick={() => navigate('/farmer/login')}
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
            Login as Farmer
          </button>
        </div>
      </div>
    </div>
  );
}

export default FarmerSignupPage;
