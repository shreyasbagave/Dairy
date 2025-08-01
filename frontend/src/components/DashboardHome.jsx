import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const [adminInfo, setAdminInfo] = useState({ username: '', role: 'admin' });
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalMilkLogs: 0,
    todayLogs: 0
  });
  const [loading, setLoading] = useState(true);
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

    // Fetch dashboard stats
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch farmers count
      const farmersRes = await fetch('/admin/farmers', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });
      
      // Fetch milk logs count
      const logsRes = await fetch('/admin/milk-logs', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      if (farmersRes.ok && logsRes.ok) {
        const farmers = await farmersRes.json();
        const logs = await logsRes.json();
        
        // Get today's logs
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(log => 
          log.date && log.date.split('T')[0] === today
        );

        setStats({
          totalFarmers: farmers.length,
          totalMilkLogs: logs.length,
          todayLogs: todayLogs.length
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'farmers':
        navigate('/admin/dashboard/farmers');
        break;
      case 'milk-logging':
        navigate('/admin/dashboard/milk-logging');
        break;
      case 'milk-logs':
        navigate('/admin/dashboard/milk-logs');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div style={{ fontSize: 18, color: '#718096' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: 40,
        borderRadius: 16,
        marginBottom: 32,
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: 32 }}>
          {getGreeting()}, {adminInfo.username}! 👋
        </h1>
        <p style={{ margin: 0, fontSize: 18, opacity: 0.9 }}>
          Welcome to your Dairy Management Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👥</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
            Total Farmers
          </h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#4299e1' }}>
            {stats.totalFarmers}
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🥛</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
            Total Milk Logs
          </h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#38a169' }}>
            {stats.totalMilkLogs}
          </div>
        </div>

        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
            Today's Logs
          </h3>
          <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ed8936' }}>
            {stats.todayLogs}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#fff',
        padding: 32,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 24px 0', color: '#2d3748' }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}>
          <button
            onClick={() => handleQuickAction('farmers')}
            style={{
              padding: 20,
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#fff',
              width: '100%',
              ':hover': {
                borderColor: '#4299e1',
                background: '#f7fafc'
              }
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.background = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#fff';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
              Manage Farmers
            </h4>
            <p style={{ margin: 0, fontSize: 14, color: '#718096' }}>
              Add, edit, or remove farmers
            </p>
          </button>

          <button
            onClick={() => handleQuickAction('milk-logging')}
            style={{
              padding: 20,
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#fff',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.background = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#fff';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🥛</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
              Log Milk
            </h4>
            <p style={{ margin: 0, fontSize: 14, color: '#718096' }}>
              Record milk collection data
            </p>
          </button>

          <button
            onClick={() => handleQuickAction('milk-logs')}
            style={{
              padding: 20,
              border: '2px solid #e2e8f0',
              borderRadius: 8,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#fff',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#4299e1';
              e.target.style.background = '#f7fafc';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#fff';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>
              View Reports
            </h4>
            <p style={{ margin: 0, fontSize: 14, color: '#718096' }}>
              Check milk logs and reports
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome; 