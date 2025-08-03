import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const sessionOptions = ['Morning', 'Evening'];

// Helper function to format numbers to exactly 2 decimal places
const formatToTwoDecimals = (value) => {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toFixed(2);
};

function MilkLogging() {
  const [date, setDate] = useState('');
  const [session, setSession] = useState('Morning');
  const [form, setForm] = useState({
    farmerId: '',
    quantity: '',
    fat: '',
    rate: '',
  });
  const [totalCost, setTotalCost] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');
  const [farmers, setFarmers] = useState([]);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if ((name === 'quantity' || name === 'rate') && (name === 'quantity' ? value : form.quantity) && (name === 'rate' ? value : form.rate)) {
      setTotalCost(((name === 'quantity' ? value : form.quantity) * (name === 'rate' ? value : form.rate)));
    }
  };

  const handleDateChange = e => setDate(e.target.value);
  const handleSessionChange = e => setSession(e.target.value);

  // Fetch logs for the selected date
  const fetchLogsForDate = async (dateToFetch) => {
    if (!dateToFetch) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const params = new URLSearchParams({ date: dateToFetch });
      const response = await apiCall(`/admin/filter-milk-logs?${params.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setMessage('Failed to fetch logs');
      }
    } catch (error) {
      setMessage(error.message || 'Error fetching logs');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (date) fetchLogsForDate(date);
    else setLogs([]);
    // eslint-disable-next-line
  }, [date]);

  // Fetch farmers for name lookup
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const response = await apiCall('/admin/farmers', {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          setFarmers(data);
        }
      } catch (error) {
        console.error('Error fetching farmers:', error);
      }
    };

    fetchFarmers();
  }, []);

  // Function to get farmer name by farmer_id
  const getFarmerName = (farmerId) => {
    const farmer = farmers.find(f => f.farmer_id === farmerId);
    return farmer ? farmer.name : '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!date) return alert('Please select a date first!');
    if (!session) return alert('Please select a session!');
    setLoading(true);
    setMessage('');
    
    try {
      const response = await apiCall('/admin/add-milk-log', {
        method: 'POST',
        body: JSON.stringify({
          farmer_id: form.farmerId,
          date,
          session,
          quantity_liters: Number(form.quantity),
          fat_percent: Number(form.fat),
          rate_per_liter: Number(form.rate)
        })
      });
      
      if (response.ok) {
        setMessage('Milk log added successfully!');
        setForm({ farmerId: '', quantity: '', fat: '', rate: '' });
        setTotalCost(0);
        // Refetch logs for the selected date
        fetchLogsForDate(date);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to add milk log.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error adding milk log:', error);
    }
    
    setLoading(false);
  };

  // Filter logs by session
  const filteredLogs = logs.filter(log => log.session === session);

  // Rename for entry total cost
  const entryTotalCost = totalCost;

  // Summary calculations
  const uniqueFarmers = new Set(filteredLogs.map(log => log.farmer_id)).size;
  const totalQuantity = filteredLogs.reduce((sum, log) => sum + (log.quantity_liters || 0), 0);
  const avgFat = filteredLogs.length > 0 ? (filteredLogs.reduce((sum, log) => sum + (log.fat_percent || 0), 0) / filteredLogs.length) : 0;
  const summaryTotalCost = filteredLogs.reduce((sum, log) => sum + (log.total_cost || 0), 0);

  const handleDeleteLog = async (logId, farmerId, quantity) => {
    const confirmMessage = `Are you sure you want to delete this milk log?\n\nFarmer ID: ${farmerId}\nQuantity: ${quantity}L\nSession: ${session}\nDate: ${date}\n\nThis action cannot be undone!`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const response = await apiCall(`/admin/delete-milk-log/${logId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Milk log deleted successfully!\n\nDeleted:\n• Farmer ID: ${result.deletedLog.farmer_id}\n• Date: ${new Date(result.deletedLog.date).toLocaleDateString()}\n• Session: ${result.deletedLog.session}\n• Quantity: ${result.deletedLog.quantity_liters}L`);
        
        // Refetch logs for the selected date
        fetchLogsForDate(date);
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to delete milk log: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`❌ Network error: ${err.message}`);
    }
  };

  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create CSV content with main data
    const headers = ['Farmer ID', 'Farmer Name', 'Session', 'Quantity (L)', 'Fat %', 'Rate', 'Total'];
    const mainData = filteredLogs.map(log => [
      log.farmer_id,
      getFarmerName(log.farmer_id),
      log.session,
      formatToTwoDecimals(log.quantity_liters),
      formatToTwoDecimals(log.fat_percent),
      formatToTwoDecimals(log.rate_per_liter),
      formatToTwoDecimals(log.total_cost)
    ]);
    
    // Add summary data
    const summaryData = [
      [], // Empty row for spacing
      ['SUMMARY'],
      ['Total Farmers', uniqueFarmers],
      ['Total Quantity (L)', formatToTwoDecimals(totalQuantity)],
      ['Average Fat %', formatToTwoDecimals(avgFat)],
      ['Total Cost', formatToTwoDecimals(summaryTotalCost)]
    ];
    
    const csvContent = [
      headers.join(','),
      ...mainData.map(row => row.join(',')),
      ...summaryData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `milk_logs_${date}_${session}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: 'clamp(8px, 2vw, 16px)' }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: 'clamp(16px, 4vw, 24px)',
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        color: '#2d3748'
      }}>
        Milk Collection Logging
      </h2>
      
      {/* Date and Session Selection */}
      <div style={{ 
        marginBottom: 'clamp(16px, 4vw, 24px)', 
        display: 'flex', 
        gap: 'clamp(8px, 2vw, 16px)', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ 
            fontWeight: '500',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            color: '#2d3748'
          }}>
            Date for Entries:
          </label>
          <input 
            name="date" 
            type="date" 
            value={date} 
            onChange={handleDateChange} 
            required 
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              fontSize: 'clamp(14px, 3vw, 16px)',
              minHeight: '44px'
            }} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ 
            fontWeight: '500',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            color: '#2d3748'
          }}>
            Session:
          </label>
          <select 
            name="session" 
            value={session} 
            onChange={handleSessionChange} 
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              fontSize: 'clamp(14px, 3vw, 16px)',
              minHeight: '44px'
            }}
          >
            {sessionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Add Entry Form */}
      <form onSubmit={handleSubmit} style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 'clamp(8px, 2vw, 12px)', 
        marginBottom: 'clamp(16px, 4vw, 24px)', 
        justifyContent: 'center',
        alignItems: 'end'
      }} className="form-grid">
        <input 
          name="farmerId" 
          value={form.farmerId} 
          onChange={handleFormChange} 
          placeholder="Farmer ID" 
          required 
          style={{ 
            padding: 'clamp(8px, 2vw, 12px)', 
            borderRadius: '6px', 
            border: '1px solid #ccc', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            minHeight: '44px'
          }} 
        />
        <input 
          name="quantity" 
          type="number" 
          step="0.01"
          value={form.quantity} 
          onChange={handleFormChange} 
          placeholder="Quantity (L)" 
          required 
          style={{ 
            padding: 'clamp(8px, 2vw, 12px)', 
            borderRadius: '6px', 
            border: '1px solid #ccc', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            minHeight: '44px'
          }} 
        />
        <input 
          name="fat" 
          type="number" 
          step="0.01"
          value={form.fat} 
          onChange={handleFormChange} 
          placeholder="Fat %" 
          required 
          style={{ 
            padding: 'clamp(8px, 2vw, 12px)', 
            borderRadius: '6px', 
            border: '1px solid #ccc', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            minHeight: '44px'
          }} 
        />
        <input 
          name="rate" 
          type="number" 
          step="0.01"
          value={form.rate} 
          onChange={handleFormChange} 
          placeholder="Rate" 
          required 
          style={{ 
            padding: 'clamp(8px, 2vw, 12px)', 
            borderRadius: '6px', 
            border: '1px solid #ccc', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            minHeight: '44px'
          }} 
        />
        <input 
          value={formatToTwoDecimals(entryTotalCost)} 
          readOnly 
          placeholder="Total Cost" 
          style={{ 
            padding: 'clamp(8px, 2vw, 12px)', 
            background: '#f1f5f9', 
            borderRadius: '6px', 
            border: '1px solid #ccc', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            minHeight: '44px'
          }} 
        />
        <button 
          type="submit" 
          style={{ 
            padding: 'clamp(8px, 2vw, 12px)', 
            borderRadius: '6px', 
            background: '#2563eb', 
            color: '#fff', 
            border: 'none', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontWeight: '600',
            minHeight: '44px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Saving...' : 'Add Entry'}
        </button>
      </form>

      {message && (
        <div style={{ 
          marginBottom: 'clamp(12px, 3vw, 16px)', 
          color: message.includes('success') ? 'green' : 'red', 
          textAlign: 'center',
          fontSize: 'clamp(14px, 3vw, 16px)'
        }}>
          {message}
        </div>
      )}

      {/* Table of logs for the selected date and session */}
      <div style={{ 
        marginTop: 'clamp(20px, 5vw, 32px)', 
        maxWidth: '100%', 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        background: '#f8fafc', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        padding: 'clamp(16px, 4vw, 24px)',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 'clamp(12px, 3vw, 16px)',
          fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
          color: '#2d3748'
        }}>
          Milk Logs for {date || '...'} ({session})
        </h3>
        {logsLoading ? (
          <div style={{ 
            padding: 'clamp(12px, 3vw, 16px)', 
            textAlign: 'center',
            fontSize: 'clamp(14px, 3vw, 16px)'
          }}>
            Loading logs...
          </div>
        ) : logsError ? (
          <div style={{ 
            color: 'red', 
            padding: 'clamp(12px, 3vw, 16px)', 
            textAlign: 'center',
            fontSize: 'clamp(14px, 3vw, 16px)'
          }}>
            {logsError}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ 
            padding: 'clamp(12px, 3vw, 16px)', 
            textAlign: 'center',
            fontSize: 'clamp(14px, 3vw, 16px)'
          }}>
            No logs for this date and session.
          </div>
        ) : (
                  <div style={{ overflowX: 'auto' }} className="table-container">
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'clamp(12px, 2.5vw, 14px)',
            minWidth: '700px',
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}>
              <thead>
                <tr style={{ background: '#2563eb', color: '#fff' }}>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'left',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Farmer ID
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'left',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Farmer Name
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Session
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Quantity (L)
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Fat %
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Rate
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Total
                  </th>
                  <th style={{ 
                    padding: 'clamp(8px, 2vw, 12px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    fontWeight: '600'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={log.log_id || log._id || log.id} style={{
                    background: idx % 2 === 0 ? '#fff' : '#f8f9fa',
                    transition: 'background 0.2s'
                  }}>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      fontSize: 'clamp(11px, 2vw, 12px)',
                      fontWeight: '500'
                    }}>
                      {log.farmer_id}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      fontSize: 'clamp(11px, 2vw, 12px)'
                    }}>
                      {getFarmerName(log.farmer_id)}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      textAlign: 'center',
                      fontSize: 'clamp(11px, 2vw, 12px)'
                    }}>
                      {log.session}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      textAlign: 'center',
                      fontWeight: '500',
                      fontSize: 'clamp(11px, 2vw, 12px)'
                    }}>
                      {formatToTwoDecimals(log.quantity_liters)}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      textAlign: 'center',
                      fontSize: 'clamp(11px, 2vw, 12px)'
                    }}>
                      {formatToTwoDecimals(log.fat_percent)}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      textAlign: 'center',
                      fontSize: 'clamp(11px, 2vw, 12px)'
                    }}>
                      ₹{formatToTwoDecimals(log.rate_per_liter)}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      textAlign: 'center', 
                      fontWeight: '600', 
                      color: '#38a169',
                      fontSize: 'clamp(11px, 2vw, 12px)'
                    }}>
                      ₹{formatToTwoDecimals(log.total_cost)}
                    </td>
                    <td style={{ 
                      padding: 'clamp(6px, 1.5vw, 12px)', 
                      textAlign: 'center'
                    }}>
                      <button 
                        onClick={() => handleDeleteLog(log.log_id, log.farmer_id, log.quantity_liters)}
                        style={{ 
                          padding: 'clamp(4px, 1vw, 8px)', 
                          borderRadius: '4px', 
                          background: '#dc2626', 
                          color: '#fff', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontSize: 'clamp(10px, 1.5vw, 12px)',
                          minHeight: '32px',
                          minWidth: '60px'
                        }}
                        title="Delete this milk log"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Table */}
      <div style={{ 
        marginTop: 'clamp(20px, 5vw, 32px)', 
        maxWidth: '100%', 
        marginLeft: 'auto', 
        marginRight: 'auto', 
        background: '#f8fafc', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
        padding: 'clamp(16px, 4vw, 24px)',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 'clamp(12px, 3vw, 16px)',
          flexWrap: 'wrap',
          gap: 'clamp(8px, 2vw, 12px)'
        }}>
          <h3 style={{ 
            textAlign: 'center', 
            margin: 0,
            fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
            color: '#2d3748'
          }}>
            Summary for {date || '...'} ({session})
          </h3>
          <button 
            onClick={exportCSV} 
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)', 
              borderRadius: '6px', 
              background: '#2563eb', 
              color: '#fff', 
              border: 'none', 
              fontSize: 'clamp(14px, 3vw, 16px)',
              fontWeight: '600',
              minHeight: '44px',
              cursor: 'pointer'
            }}
          >
            Export to CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }} className="table-container">
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate', 
            borderSpacing: 0, 
            background: '#fff', 
            borderRadius: '10px', 
            overflow: 'hidden', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            minWidth: '400px'
          }}>
            <thead>
              <tr style={{ background: '#2563eb', color: '#fff' }}>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Total Farmers
                </th>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Total Quantity (L)
                </th>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Average Fat %
                </th>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#f1f5f9' }}>
                <td style={{ 
                  padding: 'clamp(6px, 1.5vw, 10px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  {uniqueFarmers}
                </td>
                <td style={{ 
                  padding: 'clamp(6px, 1.5vw, 10px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  {formatToTwoDecimals(totalQuantity)}
                </td>
                <td style={{ 
                  padding: 'clamp(6px, 1.5vw, 10px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  {formatToTwoDecimals(avgFat)}
                </td>
                <td style={{ 
                  padding: 'clamp(6px, 1.5vw, 10px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  ₹{formatToTwoDecimals(summaryTotalCost)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MilkLogging; 