import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProfileManagement from '../components/ProfileManagement';

function AdminDashboard() {
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
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
    
    // Get user info from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo(payload);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileMenu && !event.target.closest('.mobile-sidebar') && !event.target.closest('.mobile-menu-button')) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [showMobileMenu]);

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

  const handleMenuClick = (path) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f7fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Mobile Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }} className="show-mobile hide-desktop">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="mobile-menu-button"
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
          >
            ☰
          </button>
          <h1 style={{ 
            margin: 0, 
            fontSize: 'clamp(1rem, 4vw, 1.3rem)',
            fontWeight: '600'
          }}>
            {userInfo?.username || 'Admin'}
          </h1>
        </div>
        
      </header>

      {/* Mobile Sidebar Overlay */}
      {showMobileMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex'
        }} className="show-mobile hide-desktop">
          <div 
            className="mobile-sidebar"
            style={{
              background: '#fff',
              width: '280px',
              height: '100vh',
              boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {/* Mobile Sidebar Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>
                {userInfo?.username || 'Admin'} Menu
              </h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  minWidth: '32px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Mobile Sidebar Menu Items */}
            <div style={{
              flex: 1,
              padding: '16px 0',
              overflowY: 'auto'
            }}>
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleMenuClick(item.path)}
                  style={{
                    background: isActive(item.path) ? '#2563eb' : 'transparent',
                    color: isActive(item.path) ? '#fff' : '#2d3748',
                    border: 'none',
                    padding: '16px 20px',
                    borderRadius: '0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '1rem',
                    fontWeight: isActive(item.path) ? '600' : '500',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    minHeight: '56px',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <span style={{ fontSize: '1.3em' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Mobile Sidebar Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: '100%',
                  minHeight: '48px',
                  marginBottom: '8px'
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
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: '100%',
                  minHeight: '48px'
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}

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
          ☰
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
      }} className="hide-mobile">
        {/* Desktop Header */}
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
                {userInfo?.username || 'Admin'} Dashboard
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Profile Button */}
              <button
                onClick={() => navigate('/profile')}
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
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

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

      {/* Mobile Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 60px)'
      }} className="show-mobile hide-desktop">
        {/* Mobile Content */}
        <main style={{
          flex: 1,
          padding: 'clamp(8px, 2vw, 12px)',
          overflowY: 'auto',
          background: '#f7fafc'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: 'clamp(12px, 3vw, 16px)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minHeight: 'calc(100vh - 120px)',
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

      {/* CSS Animation for mobile sidebar */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard; 