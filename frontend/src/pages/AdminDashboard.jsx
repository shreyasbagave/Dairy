import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProfileManagement from '../components/ProfileManagement';

function AdminDashboard() {
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if device is mobile on component mount
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      setSidebarCollapsed(isMobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const isActive = (path) => location.pathname.includes(path);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/admin/dashboard/farmers', label: 'Farmers', icon: '👥' },
    { path: '/admin/dashboard/milk-logging', label: 'Milk Logging', icon: '🥛' },
    { path: '/admin/dashboard/milk-logs', label: 'Milk Logs', icon: '📊' },
    { path: '/admin/dashboard/farmer-records', label: 'Records', icon: '📋' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f7fafc',
      display: 'flex'
    }}>
      {/* Desktop Sidebar */}
      <nav style={{
        background: '#fff',
        width: sidebarCollapsed ? '60px' : '250px',
        borderRight: '1px solid #e2e8f0',
        padding: '20px 0',
        boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'width 0.3s ease',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 1000,
        overflowY: 'auto'
      }} className="hide-mobile">
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer',
            margin: '0 12px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40px',
            minWidth: '40px'
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>

        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: isActive(item.path) ? '#2563eb' : 'transparent',
              color: isActive(item.path) ? '#fff' : '#2d3748',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '0',
              cursor: 'pointer',
              textAlign: sidebarCollapsed ? 'center' : 'left',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: isActive(item.path) ? '600' : '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              minHeight: '44px'
            }}
            title={sidebarCollapsed ? item.label : ''}
          >
            <span style={{ fontSize: '1.2em' }}>{item.icon}</span>
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? '60px' : '250px',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          padding: 'clamp(12px, 3vw, 20px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1200px',
            margin: '0 auto',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}>
                🥛 Admin Dashboard
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  minHeight: '40px'
                }}
                className="show-mobile hide-desktop"
              >
                ☰
              </button>

              {/* Profile Button */}
              <button
                onClick={() => setShowProfile(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  padding: 'clamp(6px, 2vw, 16px)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                  minHeight: '40px',
                  whiteSpace: 'nowrap'
                }}
                className="hide-mobile"
              >
                👤 Profile
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  padding: 'clamp(6px, 2vw, 16px)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                  minHeight: '40px',
                  whiteSpace: 'nowrap'
                }}
                className="hide-mobile"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div style={{
            background: '#fff',
            borderBottom: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 99
          }} className="show-mobile hide-desktop">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  style={{
                    background: isActive(item.path) ? '#2563eb' : 'transparent',
                    color: isActive(item.path) ? '#fff' : '#2d3748',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    fontWeight: isActive(item.path) ? '600' : '500',
                    transition: 'all 0.2s',
                    minHeight: '44px'
                  }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '8px', paddingTop: '8px' }}>
                <button
                  onClick={() => {
                    setShowProfile(true);
                    setShowMobileMenu(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#2d3748',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    fontWeight: '500',
                    width: '100%',
                    minHeight: '44px'
                  }}
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#dc2626',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    fontWeight: '500',
                    width: '100%',
                    minHeight: '44px'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main style={{
          flex: 1,
          padding: 'clamp(12px, 3vw, 20px)',
          overflowY: 'auto',
          background: '#f7fafc'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: 'clamp(16px, 4vw, 24px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: 'calc(100vh - 200px)',
            overflow: 'auto'
          }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Profile Management Modal */}
      {showProfile && (
        <ProfileManagement
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default AdminDashboard; 