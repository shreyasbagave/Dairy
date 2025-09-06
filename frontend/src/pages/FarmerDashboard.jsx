import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function FarmerDashboard() {
  const [farmerInfo, setFarmerInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [feedPurchases, setFeedPurchases] = useState([]);
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterSession, setFilterSession] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const navigate = useNavigate();

  // Get current date and time
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const currentTime = currentDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  // Format date to DD/MM/YYYY
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch all farmer data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all farmer data from the comprehensive endpoint
      const response = await apiCall('/farmer-auth/all-data', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setFarmerInfo(data.farmer);
        setLogs(data.milkLogs || []);
        setFeedPurchases(data.feedPurchases || []);
        setBills(data.bills || []);
        setSummary(data.summary || {});
      } else {
        // Fallback to individual endpoints if comprehensive endpoint fails
        console.log('Comprehensive endpoint failed, trying individual endpoints...');
        
        const [profileResponse, logsResponse] = await Promise.all([
          apiCall('/farmer-auth/profile', { method: 'GET' }),
          apiCall('/farmer/milk-logs-new', { method: 'GET' })
        ]);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setFarmerInfo(profileData);
        }

        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setLogs(logsData);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate summaries
  const calculateSummaries = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Today's collection
    const todayLogs = logs.filter(log => log.date === today);
    const todayTotal = todayLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);
    const todaySessions = todayLogs.length;
    
    // Monthly collection
    const monthlyLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= currentMonthStart && logDate <= currentDate;
    });
    const monthlyTotal = monthlyLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);
    const monthlySessions = monthlyLogs.length;
    
    // Average per session
    const avgPerSession = monthlySessions > 0 ? (monthlyTotal / monthlySessions).toFixed(2) : 0;
    
    return {
      today: { total: todayTotal, sessions: todaySessions },
      monthly: { total: monthlyTotal, sessions: monthlySessions, avgPerSession }
    };
  };

  const summaries = calculateSummaries();

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('farmerInfo');
    navigate('/farmer/login');
  };

  // Navigation menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'milk-logs', label: 'Milk Logs', icon: '🥛' },
    { id: 'statistics', label: 'Statistics', icon: '📊' },
    { id: 'feed', label: 'Feed', icon: '🌾' },
    { id: 'billing', label: 'Billing', icon: '💰' }
  ];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
          <div style={{ color: '#2d3748', fontSize: '18px' }}>Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '16px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            color: '#2d3748',
            fontWeight: '600'
          }}>
            🐄 Farmer Dashboard
          </h1>
          {farmerInfo && (
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#718096'
            }}>
              Welcome, {farmerInfo.name} (ID: {farmerInfo.farmer_id})
            </p>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          color: '#4a5568'
        }}>
          <span>📅 {formatDate(currentDate)}</span>
          <span>🕐 {currentTime}</span>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Navigation Menu */}
        <div style={{
          width: '250px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '20px 0',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: activeTab === item.id ? '#667eea' : 'transparent',
                color: activeTab === item.id ? '#fff' : '#2d3748',
                border: 'none',
                padding: '16px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: activeTab === item.id ? '4px solid #4c51bf' : '4px solid transparent'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #fecaca',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div>
              {/* Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}>
                {/* Today's Collection */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      color: '#2d3748',
                      fontWeight: '600'
                    }}>
                      📅 Today's Collection
                    </h3>
                    <span style={{
                      fontSize: '24px',
                      color: '#059669'
                    }}>
                      🥛
                    </span>
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#059669',
                    marginBottom: '8px'
                  }}>
                    {summaries.today.total.toFixed(2)} L
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#718096'
                  }}>
                    {summaries.today.sessions} session{summaries.today.sessions !== 1 ? 's' : ''} today
                  </div>
                </div>

                {/* Monthly Collection */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.125rem',
                      color: '#2d3748',
                      fontWeight: '600'
                    }}>
                      📊 {currentMonth} Summary
                    </h3>
                    <span style={{
                      fontSize: '24px',
                      color: '#2563eb'
                    }}>
                      📈
                    </span>
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#2563eb',
                    marginBottom: '8px'
                  }}>
                    {summaries.monthly.total.toFixed(2)} L
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#718096',
                    marginBottom: '4px'
                  }}>
                    {summaries.monthly.sessions} total sessions
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#718096'
                  }}>
                    Avg: {summaries.monthly.avgPerSession} L per session
                  </div>
                </div>

                {/* Farmer Info Card */}
                {farmerInfo && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        color: '#2d3748',
                        fontWeight: '600'
                      }}>
                        👤 Farmer Details
                      </h3>
                      <span style={{
                        fontSize: '24px',
                        color: '#7c3aed'
                      }}>
                        🆔
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.6' }}>
                      <div><strong>Name:</strong> {farmerInfo.name}</div>
                      <div><strong>ID:</strong> {farmerInfo.farmer_id}</div>
                      <div><strong>Phone:</strong> {farmerInfo.phone}</div>
                      <div><strong>Status:</strong> 
                        <span style={{
                          color: farmerInfo.is_active ? '#059669' : '#dc2626',
                          fontWeight: '500'
                        }}>
                          {farmerInfo.is_active ? ' Active' : ' Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.25rem',
                  color: '#2d3748',
                  fontWeight: '600'
                }}>
                  📋 Recent Milk Logs
                </h3>
                {logs.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#718096',
                    fontSize: '1rem'
                  }}>
                    No milk logs found. Start logging your milk collection!
                  </div>
                ) : (
                  <div style={{
                    overflowX: 'auto'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem'
                    }}>
                      <thead>
                        <tr style={{
                          background: '#f7fafc',
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748'
                          }}>Date</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748'
                          }}>Session</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748'
                          }}>Quantity (L)</th>
                          <th style={{
                            padding: '12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748'
                          }}>Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.slice(0, 10).map((log, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <td style={{ padding: '12px', color: '#4a5568' }}>
                              {new Date(log.date).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px', color: '#4a5568' }}>
                              {log.session || 'N/A'}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              color: '#059669',
                              fontWeight: '600'
                            }}>
                              {log.quantity ? log.quantity.toFixed(2) : '0.00'}
                            </td>
                            <td style={{ padding: '12px', color: '#4a5568' }}>
                              {log.section || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              {farmerInfo ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <h3 style={{
                    margin: '0 0 24px 0',
                    fontSize: '1.5rem',
                    color: '#2d3748',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    👤 My Complete Profile
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '24px'
                  }}>
                    {/* Personal Information */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{
                        margin: '0 0 16px 0',
                        fontSize: '1.125rem',
                        color: '#2d3748',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📋 Personal Information
                      </h4>
                      <div style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.8' }}>
                        <div><strong>Farmer ID:</strong> {farmerInfo.farmer_id}</div>
                        <div><strong>Full Name:</strong> {farmerInfo.name}</div>
                        <div><strong>Phone Number:</strong> {farmerInfo.phone}</div>
                        <div><strong>Address:</strong> {farmerInfo.address}</div>
                        <div><strong>Admin ID:</strong> {farmerInfo.admin_id}</div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{
                        margin: '0 0 16px 0',
                        fontSize: '1.125rem',
                        color: '#2d3748',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🔐 Account Status
                      </h4>
                      <div style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: '1.8' }}>
                        <div><strong>Account Status:</strong> 
                          <span style={{
                            color: farmerInfo.is_active ? '#059669' : '#dc2626',
                            fontWeight: '600',
                            marginLeft: '8px'
                          }}>
                            {farmerInfo.is_active ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                        <div><strong>Login Status:</strong> 
                          <span style={{
                            color: farmerInfo.is_first_login ? '#f59e0b' : '#059669',
                            fontWeight: '600',
                            marginLeft: '8px'
                          }}>
                            {farmerInfo.is_first_login ? '🔄 First Time Login' : '✅ Regular User'}
                          </span>
                        </div>
                        <div><strong>Password Set:</strong> 
                          <span style={{
                            color: farmerInfo.password_hash ? '#059669' : '#f59e0b',
                            fontWeight: '600',
                            marginLeft: '8px'
                          }}>
                            {farmerInfo.password_hash ? '✅ Yes' : '⚠️ Not Set'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bank Details */}
                    {farmerInfo.bank_details && (
                      <div style={{
                        background: '#f8fafc',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        gridColumn: '1 / -1'
                      }}>
                        <h4 style={{
                          margin: '0 0 16px 0',
                          fontSize: '1.125rem',
                          color: '#2d3748',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🏦 Bank Details
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '16px',
                          fontSize: '0.875rem',
                          color: '#4a5568',
                          lineHeight: '1.8'
                        }}>
                          <div><strong>Account Number:</strong> {farmerInfo.bank_details.account_no}</div>
                          <div><strong>IFSC Code:</strong> {farmerInfo.bank_details.ifsc}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#718096', fontSize: '1rem' }}>
                    Loading profile information...
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'milk-logs' && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '1.5rem',
                  color: '#2d3748',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  🥛 Complete Milk Collection Records
                </h3>

                {/* Filters */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: '#2d3748',
                      fontSize: '0.875rem'
                    }}>
                      Month:
                    </label>
                    <input
                      type="month"
                      value={filterMonth}
                      onChange={e => setFilterMonth(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
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
                      fontSize: '0.875rem'
                    }}>
                      Session:
                    </label>
                    <select
                      value={filterSession}
                      onChange={e => setFilterSession(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="All">All Sessions</option>
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                </div>

                {/* Milk Logs Table */}
                {logs.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#718096',
                    fontSize: '1rem'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🥛</div>
                    <div>No milk collection records found.</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                      Your milk collection data will appear here once recorded.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem',
                      background: '#fff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <thead>
                        <tr style={{ background: '#f7fafc' }}>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Date</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Session</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Quantity (L)</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Fat %</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Rate/L</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs
                          .filter(log => {
                            const logDate = new Date(log.date);
                            const selectedMonth = new Date(filterMonth + '-01');
                            const monthMatch = logDate.getMonth() === selectedMonth.getMonth() && 
                                             logDate.getFullYear() === selectedMonth.getFullYear();
                            const sessionMatch = filterSession === 'All' || log.session === filterSession;
                            return monthMatch && sessionMatch;
                          })
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((log, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background-color 0.2s'
                          }}>
                            <td style={{ 
                              padding: '12px',
                              color: '#4a5568',
                              fontWeight: '500'
                            }}>
                              {log.date || formatDate(log.originalDate)}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#4a5568'
                            }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: log.session === 'Morning' ? '#fef3c7' : '#dbeafe',
                                color: log.session === 'Morning' ? '#92400e' : '#1e40af'
                              }}>
                                {log.session || 'N/A'}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#059669',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {log.quantity_liters ? log.quantity_liters.toFixed(2) : (log.quantity ? log.quantity.toFixed(2) : '0.00')}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#4a5568',
                              textAlign: 'right'
                            }}>
                              {log.fat_percent ? log.fat_percent.toFixed(1) : 'N/A'}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#4a5568',
                              textAlign: 'right'
                            }}>
                              ₹{log.rate_per_liter ? log.rate_per_liter.toFixed(2) : 'N/A'}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#059669',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              ₹{log.total_cost ? log.total_cost.toFixed(2) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '1.5rem',
                  color: '#2d3748',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  📊 Detailed Statistics & Analytics
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Total Collection */}
                  <div style={{
                    background: '#f0fdf4',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#166534',
                      fontWeight: '600'
                    }}>
                      🥛 Total Milk Collected
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      {logs.reduce((sum, log) => sum + (log.quantity_liters || log.quantity || 0), 0).toFixed(2)} L
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#166534',
                      marginTop: '4px'
                    }}>
                      All time collection
                    </div>
                  </div>

                  {/* Total Earnings */}
                  <div style={{
                    background: '#fef3c7',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #fde68a'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#92400e',
                      fontWeight: '600'
                    }}>
                      💰 Total Earnings
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#d97706'
                    }}>
                      ₹{logs.reduce((sum, log) => sum + (log.total_cost || 0), 0).toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#92400e',
                      marginTop: '4px'
                    }}>
                      All time earnings
                    </div>
                  </div>

                  {/* Average per Session */}
                  <div style={{
                    background: '#dbeafe',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #93c5fd'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#1e40af',
                      fontWeight: '600'
                    }}>
                      📈 Average per Session
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#2563eb'
                    }}>
                      {logs.length > 0 ? (logs.reduce((sum, log) => sum + (log.quantity_liters || log.quantity || 0), 0) / logs.length).toFixed(2) : '0.00'} L
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#1e40af',
                      marginTop: '4px'
                    }}>
                      {logs.length} total sessions
                    </div>
                  </div>

                  {/* Best Day */}
                  <div style={{
                    background: '#f3e8ff',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #c4b5fd'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#7c2d12',
                      fontWeight: '600'
                    }}>
                      🏆 Best Collection Day
                    </h4>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#7c3aed'
                    }}>
                      {logs.length > 0 ? Math.max(...logs.map(log => log.quantity_liters || log.quantity || 0)).toFixed(2) : '0.00'} L
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#7c2d12',
                      marginTop: '4px'
                    }}>
                      Highest single day
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '1.5rem',
                  color: '#2d3748',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  🌾 Feed Purchase Records
                </h3>

                {/* Feed Summary Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    background: '#f0fdf4',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#166534',
                      fontWeight: '600'
                    }}>
                      📦 Total Feed Purchased
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      {summary.totalFeedPurchased || 0} kg
                    </div>
                  </div>

                  <div style={{
                    background: '#fef3c7',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #fde68a'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#92400e',
                      fontWeight: '600'
                    }}>
                      💰 Total Feed Cost
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#d97706'
                    }}>
                      ₹{summary.totalFeedCost || 0}
                    </div>
                  </div>

                  <div style={{
                    background: '#dbeafe',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #93c5fd'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#1e40af',
                      fontWeight: '600'
                    }}>
                      📊 Total Purchases
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#2563eb'
                    }}>
                      {summary.totalFeedPurchases || 0}
                    </div>
                  </div>
                </div>

                {/* Feed Purchase Table */}
                {feedPurchases.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#718096',
                    fontSize: '1rem'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌾</div>
                    <div>No feed purchase records found.</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                      Your feed purchase data will appear here once recorded.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem',
                      background: '#fff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <thead>
                        <tr style={{ background: '#f7fafc' }}>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Date</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Quantity (kg)</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Price (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feedPurchases.map((feed, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <td style={{ 
                              padding: '12px',
                              color: '#4a5568',
                              fontWeight: '500'
                            }}>
                              {feed.date || formatDate(feed.originalDate)}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#059669',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {feed.quantity || 0} kg
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#d97706',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              ₹{feed.price || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  margin: '0 0 24px 0',
                  fontSize: '1.5rem',
                  color: '#2d3748',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  💰 Billing & Payment Records
                </h3>

                {/* Billing Summary Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    background: '#f0fdf4',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#166534',
                      fontWeight: '600'
                    }}>
                      💵 Total Earnings
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#059669'
                    }}>
                      ₹{summary.totalEarnings || 0}
                    </div>
                  </div>

                  <div style={{
                    background: '#fef3c7',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #fde68a'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#92400e',
                      fontWeight: '600'
                    }}>
                      📊 Total Bills
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#d97706'
                    }}>
                      {summary.totalBills || 0}
                    </div>
                  </div>

                  <div style={{
                    background: '#dbeafe',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #93c5fd'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      fontSize: '1rem',
                      color: '#1e40af',
                      fontWeight: '600'
                    }}>
                      🥛 Total Milk
                    </h4>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#2563eb'
                    }}>
                      {summary.totalMilkCollected || 0} L
                    </div>
                  </div>
                </div>

                {/* Bills Table */}
                {bills.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#718096',
                    fontSize: '1rem'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                    <div>No billing records found.</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                      Your billing data will appear here once generated.
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.875rem',
                      background: '#fff',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <thead>
                        <tr style={{ background: '#f7fafc' }}>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Period</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Morning (L)</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Evening (L)</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Total Amount</th>
                          <th style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            fontWeight: '600',
                            color: '#2d3748',
                            borderBottom: '2px solid #e2e8f0'
                          }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bills.map((bill, index) => (
                          <tr key={index} style={{
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                            <td style={{ 
                              padding: '12px',
                              color: '#4a5568',
                              fontWeight: '500'
                            }}>
                              {bill.period_start || formatDate(bill.originalPeriodStart)} - {bill.period_end || formatDate(bill.originalPeriodEnd)}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#059669',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {bill.morning_milk_liters || 0} L
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#059669',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              {bill.evening_milk_liters || 0} L
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#d97706',
                              fontWeight: '600',
                              textAlign: 'right'
                            }}>
                              ₹{bill.milk_total_amount || 0}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              textAlign: 'center'
                            }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: bill.status === 'paid' ? '#f0fdf4' : '#fef3c7',
                                color: bill.status === 'paid' ? '#166534' : '#92400e'
                              }}>
                                {bill.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerDashboard;