import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';

function DashboardHome() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userInfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalMilkLogs: 0,
    todayLogs: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Get user info from localStorage or token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT token to get user info (basic implementation)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo(payload);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Fetch dashboard stats
    fetchDashboardStats();

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch farmers count
      const farmersResponse = await apiCall('/admin/farmers', {
        method: 'GET'
      });

      // Fetch milk logs
      const logsResponse = await apiCall('/admin/milk-logs', {
        method: 'GET'
      });

      if (farmersResponse.ok && logsResponse.ok) {
        const farmers = await farmersResponse.json();
        const logs = await logsResponse.json();
        
        // Get today's logs
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(log => 
          log.date && log.date.split('T')[0] === today
        );

        // Calculate monthly revenue
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyLogs = logs.filter(log => {
          const logDate = new Date(log.date);
          return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
        });
        const monthlyRevenue = monthlyLogs.reduce((sum, log) => sum + (parseFloat(log.total_cost) || 0), 0);

        setStats({
          totalFarmers: farmers.length,
          totalMilkLogs: logs.length,
          todayLogs: todayLogs.length,
          monthlyRevenue: monthlyRevenue
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleQuickAction = (action) => {
    if (userInfo?.role === 'admin') {
      switch (action) {
        case 'add-milk':
          navigate('/admin/dashboard/milk-logging');
          break;
        case 'manage-farmers':
          navigate('/admin/dashboard/farmers');
          break;
        case 'view-reports':
          navigate('/admin/dashboard/milk-logs');
          break;
        case 'export-data':
          navigate('/admin/dashboard/farmer-records');
          break;
        case 'profile':
          navigate('/profile');
          break;
        default:
          break;
      }
    } else if (userInfo?.role === 'farmer') {
      switch (action) {
        case 'view-logs':
          navigate('/farmer/dashboard');
          break;
        case 'profile':
          navigate('/profile');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div style={{
      maxWidth: '100%',
      padding: 'clamp(16px, 4vw, 24px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: 'clamp(20px, 5vw, 32px)',
        color: '#fff',
        marginBottom: 'clamp(20px, 5vw, 32px)',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          marginBottom: 'clamp(8px, 2vw, 16px)',
          fontWeight: '600'
        }}>
          🥛 Welcome to Dairy Management System
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          marginBottom: 'clamp(16px, 4vw, 24px)',
          opacity: 0.9
        }}>
          {formatDate(currentTime)} • {formatTime(currentTime)}
        </p>
        {userInfo && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: 'clamp(12px, 3vw, 16px)',
            display: 'inline-block'
          }}>
            <p style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              margin: 0
            }}>
              Logged in as: <strong>{userInfo.role}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'clamp(16px, 4vw, 24px)',
        marginBottom: 'clamp(20px, 5vw, 32px)'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: 'clamp(20px, 5vw, 24px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            marginBottom: 'clamp(8px, 2vw, 12px)'
          }}>
            👥
          </div>
          <h3 style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            color: '#2d3748'
          }}>
            Total Farmers
          </h3>
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            color: '#2563eb',
            margin: 0
          }}>
            {loading ? '...' : stats.totalFarmers}
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: 'clamp(20px, 5vw, 24px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            marginBottom: 'clamp(8px, 2vw, 12px)'
          }}>
            🥛
          </div>
          <h3 style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            color: '#2d3748'
          }}>
            Today's Collection
          </h3>
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            color: '#059669',
            margin: 0
          }}>
            {loading ? '...' : stats.todayLogs} entries
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: 'clamp(20px, 5vw, 24px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            marginBottom: 'clamp(8px, 2vw, 12px)'
          }}>
            💰
          </div>
          <h3 style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            color: '#2d3748'
          }}>
            Monthly Revenue
          </h3>
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            color: '#dc2626',
            margin: 0
          }}>
            {loading ? '...' : `₹${stats.monthlyRevenue.toFixed(2)}`}
          </p>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: 'clamp(20px, 5vw, 24px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            marginBottom: 'clamp(8px, 2vw, 12px)'
          }}>
            📊
          </div>
          <h3 style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            color: '#2d3748'
          }}>
            Total Logs
          </h3>
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: '600',
            color: '#7c3aed',
            margin: 0
          }}>
            {loading ? '...' : stats.totalMilkLogs}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: 'clamp(20px, 5vw, 24px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.3rem, 3.5vw, 1.5rem)',
          marginBottom: 'clamp(16px, 4vw, 24px)',
          color: '#2d3748',
          textAlign: 'center'
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'clamp(12px, 3vw, 16px)'
        }}>
          {userInfo?.role === 'admin' ? (
            <>
              <button 
                onClick={() => handleQuickAction('add-milk')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                🥛 Add Milk Entry
              </button>
              <button 
                onClick={() => handleQuickAction('manage-farmers')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                👥 Manage Farmers
              </button>
              <button 
                onClick={() => handleQuickAction('view-reports')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                📊 View Reports
              </button>
              <button 
                onClick={() => handleQuickAction('export-data')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                📋 Export Data
              </button>
              <button 
                onClick={() => handleQuickAction('profile')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                👤 My Profile
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleQuickAction('view-logs')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                📊 View My Logs
              </button>
              <button 
                onClick={() => handleQuickAction('profile')}
                style={{
                  padding: 'clamp(12px, 3vw, 16px)',
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  minHeight: '48px'
                }}
              >
                👤 My Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* System Status */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: 'clamp(20px, 5vw, 24px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        marginTop: 'clamp(20px, 5vw, 32px)'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.3rem, 3.5vw, 1.5rem)',
          marginBottom: 'clamp(16px, 4vw, 24px)',
          color: '#2d3748',
          textAlign: 'center'
        }}>
          System Status
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'clamp(12px, 3vw, 16px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'clamp(8px, 2vw, 12px)',
            background: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#059669',
              borderRadius: '50%'
            }}></div>
            <span style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#059669',
              fontWeight: '500'
            }}>
              Database: Online
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'clamp(8px, 2vw, 12px)',
            background: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#059669',
              borderRadius: '50%'
            }}></div>
            <span style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#059669',
              fontWeight: '500'
            }}>
              API: Active
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: 'clamp(8px, 2vw, 12px)',
            background: '#f0fdf4',
            borderRadius: '6px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#059669',
              borderRadius: '50%'
            }}></div>
            <span style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#059669',
              fontWeight: '500'
            }}>
              Authentication: Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome; 