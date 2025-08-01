import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const sectionOptions = ['1–10', '11–20', '21–End'];
const sessionOptions = ['All', 'Morning', 'Evening'];

function FarmerDashboard() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [section, setSection] = useState('All');
  const [session, setSession] = useState('All');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch milk logs from database
  const fetchMilkLogs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall('/farmer/milk-logs', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch milk logs');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching milk logs:', err);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchMilkLogs();
  }, []);

  // Filter logs based on selected criteria
  const filteredLogs = logs
    .filter(log => {
      const logDate = new Date(log.date);
      const selectedMonth = new Date(month + '-01');
      return logDate.getMonth() === selectedMonth.getMonth() && 
             logDate.getFullYear() === selectedMonth.getFullYear();
    })
    .filter(log => section === 'All' ? true : log.section === section)
    .filter(log => session === 'All' ? true : log.session === session)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto', 
      background: '#fff', 
      borderRadius: '8px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      padding: 'clamp(16px, 4vw, 24px)',
      overflow: 'hidden'
    }}>
      <h1 style={{ 
        textAlign: 'center',
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        marginBottom: 'clamp(16px, 4vw, 24px)',
        color: '#2d3748'
      }}>
        🧾 My Milk Logs
      </h1>
      
      {/* Filters Section */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'clamp(12px, 3vw, 16px)', 
        marginBottom: 'clamp(16px, 4vw, 24px)',
        alignItems: 'end'
      }}>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2d3748',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
          }}>
            Month:
          </label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)',
              fontSize: 'clamp(14px, 3vw, 16px)',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              width: '100%',
              minHeight: '44px',
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
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
          }}>
            Section:
          </label>
          <select 
            value={section} 
            onChange={e => setSection(e.target.value)} 
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)',
              fontSize: 'clamp(14px, 3vw, 16px)',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              width: '100%',
              minHeight: '44px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="All">All</option>
            {sectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2d3748',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
          }}>
            Session:
          </label>
          <select 
            value={session} 
            onChange={e => setSession(e.target.value)} 
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)',
              fontSize: 'clamp(14px, 3vw, 16px)',
              border: '2px solid #e2e8f0',
              borderRadius: '6px',
              width: '100%',
              minHeight: '44px',
              backgroundColor: '#fff',
              cursor: 'pointer'
            }}
          >
            {sessionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 'clamp(20px, 5vw, 32px)',
          color: '#718096',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          Loading your milk logs...
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#dc2626',
          padding: 'clamp(12px, 3vw, 16px)',
          borderRadius: '8px',
          marginBottom: 'clamp(16px, 4vw, 24px)',
          border: '1px solid #fecaca',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div style={{
        overflowX: 'auto',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: 'clamp(12px, 2.5vw, 16px)',
          minWidth: '500px'
        }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Date
              </th>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Section
              </th>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Session
              </th>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Quantity (L)
              </th>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Fat %
              </th>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Rate
              </th>
              <th style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontWeight: '600',
                color: '#2d3748'
              }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td 
                  colSpan={7} 
                  style={{ 
                    textAlign: 'center', 
                    padding: 'clamp(16px, 4vw, 24px)',
                    color: '#718096',
                    fontSize: 'clamp(14px, 3vw, 16px)'
                  }}
                >
                  {loading ? 'Loading...' : 'No milk logs found for the selected criteria.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log._id || log.log_id || idx} style={{
                  backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f9fa'
                }}>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748'
                  }}>
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748'
                  }}>
                    {log.section || 'N/A'}
                  </td>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748'
                  }}>
                    {log.session}
                  </td>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748',
                    fontWeight: '500'
                  }}>
                    {log.quantity_liters ? parseFloat(log.quantity_liters).toFixed(2) : '0.00'}
                  </td>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748'
                  }}>
                    {log.fat_percent ? parseFloat(log.fat_percent).toFixed(2) : '0.00'}%
                  </td>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748'
                  }}>
                    ₹{log.rate_per_liter ? parseFloat(log.rate_per_liter).toFixed(2) : '0.00'}
                  </td>
                  <td style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    border: '1px solid #e2e8f0',
                    color: '#2d3748',
                    fontWeight: '600'
                  }}>
                    ₹{log.total_cost ? parseFloat(log.total_cost).toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary */}
      {filteredLogs.length > 0 && (
        <div style={{ 
          marginTop: 'clamp(16px, 4vw, 24px)', 
          padding: 'clamp(12px, 3vw, 16px)',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 'clamp(12px, 3vw, 16px)',
            textAlign: 'center'
          }}>
            <div>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '600',
                color: '#2563eb'
              }}>
                {filteredLogs.length}
              </div>
              <div style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                color: '#718096'
              }}>
                Total Entries
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '600',
                color: '#059669'
              }}>
                {filteredLogs.reduce((sum, log) => sum + (parseFloat(log.quantity_liters) || 0), 0).toFixed(2)}L
              </div>
              <div style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                color: '#718096'
              }}>
                Total Quantity
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: '600',
                color: '#dc2626'
              }}>
                ₹{filteredLogs.reduce((sum, log) => sum + (parseFloat(log.total_cost) || 0), 0).toFixed(2)}
              </div>
              <div style={{
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                color: '#718096'
              }}>
                Total Amount
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerDashboard; 