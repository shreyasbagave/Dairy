import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiCall } from '../utils/api';
import { getFarmerNameFromList, normalizeFarmerId } from '../utils/farmerDisplay';

const sessionOptions = ['Morning', 'Evening'];

// Helper function to format numbers to exactly 2 decimal places
const formatToTwoDecimals = (value) => {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toFixed(2);
};

// Helper function to get section from date
const getSectionFromDate = (date) => {
  if (!date) return '';
  const day = new Date(date).getDate();
  if (day >= 1 && day <= 10) return '1-10';
  if (day >= 11 && day <= 20) return '11-20';
  return '21-End';
};

function MilkLogging() {
  // Set current date as default
  const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const [date, setDate] = useState(currentDate);
  const [session, setSession] = useState('Morning');
  const [selectedSection, setSelectedSection] = useState(getSectionFromDate(currentDate)); // Default to current section
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
  /** Monotonic id so an older in-flight request cannot overwrite newer date/session results. */
  const fetchLogsSeq = useRef(0);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if ((name === 'quantity' || name === 'rate') && (name === 'quantity' ? value : form.quantity) && (name === 'rate' ? value : form.rate)) {
      setTotalCost(((name === 'quantity' ? value : form.quantity) * (name === 'rate' ? value : form.rate)));
    }
  };

  const handleDateChange = e => {
    const newDate = e.target.value;
    setDate(newDate);
    // Auto-update section when date changes, but allow manual override
    setSelectedSection(getSectionFromDate(newDate));
  };
  
  const handleSessionChange = e => setSession(e.target.value);
  const handleSectionChange = e => setSelectedSection(e.target.value);

  const fetchLogsForDate = useCallback(async (dateToFetch, sessionForFetch) => {
    if (!dateToFetch || !sessionForFetch) return;

    const seq = ++fetchLogsSeq.current;
    setLogsLoading(true);
    setLogsError('');

    try {
      const params = new URLSearchParams({
        date: dateToFetch,
        session: sessionForFetch
      });
      const response = await apiCall(`/admin/filter-milk-logs?${params.toString()}`, {
        method: 'GET'
      });

      if (seq !== fetchLogsSeq.current) return;

      if (response.ok) {
        const data = await response.json();
        if (seq !== fetchLogsSeq.current) return;
        setLogs(Array.isArray(data) ? data : []);
      } else {
        setLogsError('Failed to fetch logs');
        setLogs([]);
      }
    } catch (error) {
      if (seq === fetchLogsSeq.current) {
        setLogsError(error.message || 'Error fetching logs');
        setLogs([]);
      }
    } finally {
      if (seq === fetchLogsSeq.current) {
        setLogsLoading(false);
      }
    }
  }, []);

  // Fetch logs when date or session changes (no client cache — date-only cache hid logs when session changed)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (date) {
        fetchLogsForDate(date, session);
      } else {
        setLogs([]);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [date, session, fetchLogsForDate]);

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

  const getFarmerName = (farmerId) => getFarmerNameFromList(farmers, farmerId);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!date) return alert('Please select a date first!');
    if (!session) return alert('Please select a session!');
    if (!selectedSection) return alert('Please select a section!');
    setLoading(true);
    setMessage('');
    
    try {
      const response = await apiCall('/admin/add-milk-log', {
        method: 'POST',
        body: JSON.stringify({
          farmer_id: form.farmerId,
          date,
          session,
          section: selectedSection, // Include the selected section
          quantity_liters: Number(form.quantity),
          fat_percent: Number(form.fat),
          rate_per_liter: Number(form.rate)
        })
      });
      
      if (response.ok) {
        setMessage('Milk log added successfully!');
        setForm({ farmerId: '', quantity: '', fat: '', rate: '' });
        setTotalCost(0);
        await fetchLogsForDate(date, session);
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

  // Prefer API filter; normalize session in case stored casing differs
  const filteredLogs = logs.filter(
    (log) => String(log.session || '').toLowerCase() === String(session || '').toLowerCase()
  );

  // Rename for entry total cost
  const entryTotalCost = totalCost;

  // Summary calculations
  const uniqueFarmers = new Set(filteredLogs.map((log) => normalizeFarmerId(log.farmer_id))).size;
  const totalQuantity = filteredLogs.reduce((sum, log) => sum + (log.quantity_liters || 0), 0);
  const avgFat = filteredLogs.length > 0 ? (filteredLogs.reduce((sum, log) => sum + (log.fat_percent || 0), 0) / filteredLogs.length) : 0;
  const summaryTotalCost = filteredLogs.reduce((sum, log) => sum + (log.total_cost || 0), 0);

  // Get current section based on selected date
  const currentSection = getSectionFromDate(date);

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
        await fetchLogsForDate(date, session);
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
      getFarmerName(log.farmer_id) || (normalizeFarmerId(log.farmer_id) ? `ID ${normalizeFarmerId(log.farmer_id)}` : ''),
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ 
            fontWeight: '500',
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            color: '#2d3748'
          }}>
            Section:
          </label>
          <select 
            name="section" 
            value={selectedSection} 
            onChange={handleSectionChange} 
            style={{ 
              padding: 'clamp(8px, 2vw, 12px)', 
              borderRadius: '6px', 
              border: '1px solid #ccc',
              fontSize: 'clamp(14px, 3vw, 16px)',
              minHeight: '44px',
              minWidth: '100px',
              background: selectedSection === getSectionFromDate(date) ? '#f0f9ff' : '#fff',
              borderColor: selectedSection === getSectionFromDate(date) ? '#0ea5e9' : '#ccc'
            }}
          >
            <option value="1-10">1-10</option>
            <option value="11-20">11-20</option>
            <option value="21-End">21-End</option>
          </select>
          {selectedSection !== getSectionFromDate(date) && (
            <span style={{ 
              fontSize: 'clamp(10px, 2vw, 12px)', 
              color: '#059669',
              fontWeight: '500',
              background: '#d1fae5',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #10b981'
            }}>
              Manual
            </span>
          )}
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
            padding: 'clamp(20px, 5vw, 28px)',
            textAlign: 'center',
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
              fontWeight: '600',
              color: '#334155'
            }}>
              No logs for {date} — {session}
            </p>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: 'clamp(0.875rem, 2.2vw, 1rem)',
              color: '#64748b',
              lineHeight: 1.5
            }}>
              Entries are stored per date and session. If you expect data here, try the other session (Morning / Evening) or pick the date when collection was recorded.
            </p>
            <button
              type="button"
              onClick={() => fetchLogsForDate(date, session)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh list
            </button>
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
                      {getFarmerName(log.farmer_id) || (normalizeFarmerId(log.farmer_id) ? `ID ${normalizeFarmerId(log.farmer_id)}` : '—')}
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