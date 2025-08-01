import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

function MilkTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMilkLogs();
  }, []);

  const fetchMilkLogs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiCall('/admin/milk-logs', {
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

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'clamp(20px, 5vw, 32px)',
        color: '#718096',
        fontSize: 'clamp(14px, 3vw, 16px)'
      }}>
        Loading milk logs...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fef2f2',
        color: '#dc2626',
        padding: 'clamp(12px, 3vw, 16px)',
        borderRadius: '8px',
        border: '1px solid #fecaca',
        fontSize: 'clamp(14px, 3vw, 16px)'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <h2 style={{
        fontSize: 'clamp(1.3rem, 3.5vw, 1.5rem)',
        marginBottom: 'clamp(16px, 4vw, 24px)',
        color: '#2d3748',
        textAlign: 'center'
      }}>
        Milk Collection Records
      </h2>

      {logs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'clamp(20px, 5vw, 32px)',
          color: '#718096',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          No milk logs found.
        </div>
      ) : (
        <div style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'clamp(12px, 2.5vw, 16px)',
            minWidth: '600px'
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
                  Farmer ID
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
              {logs.map((log, idx) => (
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
                    color: '#2d3748',
                    fontWeight: '500'
                  }}>
                    {log.farmer_id}
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{
          marginTop: 'clamp(16px, 4vw, 24px)',
          padding: 'clamp(12px, 3vw, 16px)',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'clamp(14px, 3vw, 16px)',
            color: '#718096',
            margin: 0
          }}>
            Showing {logs.length} milk log entries
          </p>
        </div>
      )}
    </div>
  );
}

export default MilkTable; 