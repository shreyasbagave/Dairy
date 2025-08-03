import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const sessionOptions = ['All', 'Morning', 'Evening'];
const sectionOptions = ['All', '1-10', '11-20', '21-End'];

function ViewFarmerRecords() {
  const [logs, setLogs] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    farmerId: '', // Add farmerId to filters
    session: 'All',
    section: 'All',
    month: ''
  });
  const [showDetails, setShowDetails] = useState(false);

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

  // Fetch logs when farmerId changes
  useEffect(() => {
    if (filters.farmerId) {
      fetchFarmerLogs();
    } else {
      setLogs([]);
    }
  }, [filters.farmerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to get farmer name by farmer_id
  const getFarmerName = (farmerId) => {
    const farmer = farmers.find(f => f.farmer_id === farmerId);
    return farmer ? farmer.name : '';
  };

  const fetchFarmerLogs = async () => {
    if (!filters.farmerId) {
      setLogs([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ farmer_id: filters.farmerId });
      const response = await apiCall(`/admin/filter-milk-logs?${params.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        setError('Failed to fetch farmer logs');
      }
    } catch (error) {
      setError(error.message || 'Error fetching logs');
    }
    setLoading(false);
  };

  const handleChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  // Group logs by session and section
  const groupedLogs = logs.reduce((groups, log) => {
    const section = (() => {
      if (!log.date) return '';
      const day = new Date(log.date).getDate();
      if (day >= 1 && day <= 10) return '1-10';
      if (day >= 11 && day <= 20) return '11-20';
      return '21-End';
    })();
    
    const key = `${log.session}-${section}`;
    
    if (!groups[key]) {
      groups[key] = {
        session: log.session,
        section: section,
        quantity_liters: 0,
        fat_percent: 0,
        total_cost: 0,
        count: 0,
        entries: []
      };
    }
    
    groups[key].quantity_liters += log.quantity_liters || log.quantity || 0;
    groups[key].fat_percent += log.fat_percent || log.fat || 0;
    groups[key].total_cost += log.total_cost || log.total || 0;
    groups[key].count += 1;
    groups[key].entries.push(log);
    
    return groups;
  }, {});

  // Calculate average fat for each group
  Object.values(groupedLogs).forEach(group => {
    group.fat_percent = group.count > 0 ? (group.fat_percent / group.count).toFixed(2) : 0;
  });

  const filtered = Object.values(groupedLogs).filter(log => {
    return (
      (filters.session === 'All' || log.session === filters.session) &&
      (filters.section === 'All' || log.section === filters.section) &&
      (!filters.month || log.entries.some(entry => entry.date && entry.date.startsWith(filters.month)))
    );
  });

  const totalMilk = filtered.reduce((sum, l) => sum + l.quantity_liters, 0);
  const totalCost = filtered.reduce((sum, l) => sum + l.total_cost, 0);
  const avgFat = filtered.length > 0 ? (filtered.reduce((sum, l) => sum + parseFloat(l.fat_percent), 0) / filtered.length).toFixed(2) : 0;

  const exportCSV = () => {
    if (filtered.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create CSV content with summary data
    const summaryHeaders = ['Session', 'Section', 'Quantity (L)', 'Fat %', 'Total Cost', 'Entry Count'];
    const summaryData = filtered.map(log => [
      log.session,
      log.section,
      log.quantity_liters,
      log.fat_percent,
      log.total_cost,
      log.count
    ]);
    
    // Create detailed entries data
    const detailHeaders = ['Date', 'Session', 'Section', 'Quantity (L)', 'Fat %', 'Rate', 'Total Cost'];
    const detailData = logs
      .filter(log => {
        const section = (() => {
          if (!log.date) return '';
          const day = new Date(log.date).getDate();
          if (day >= 1 && day <= 10) return '1-10';
          if (day >= 11 && day <= 20) return '11-20';
          return '21-End';
        })();
        
        return (
          (filters.session === 'All' || log.session === filters.session) &&
          (filters.section === 'All' || section === filters.section) &&
          (!filters.month || (log.date && log.date.startsWith(filters.month)))
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(entry => {
        const section = (() => {
          if (!entry.date) return '';
          const day = new Date(entry.date).getDate();
          if (day >= 1 && day <= 10) return '1-10';
          if (day >= 11 && day <= 20) return '11-20';
          return '21-End';
        })();
        
        return [
          entry.date ? entry.date.slice(0, 10) : '',
          entry.session,
          section,
          (entry.quantity_liters || entry.quantity || 0).toFixed(2),
          entry.fat_percent || entry.fat || '',
          entry.rate_per_liter || entry.rate || '',
          (entry.total_cost || entry.total || 0).toFixed(2)
        ];
      });
    
    // Combine summary and detailed data
    const csvContent = [
      'SUMMARY DATA',
      summaryHeaders.join(','),
      ...summaryData.map(row => row.join(',')),
      '', // Empty row for spacing
      'DETAILED ENTRIES',
      detailHeaders.join(','),
      ...detailData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `farmer_${filters.farmerId}_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort individual entries by date
  const sortedEntries = logs
    .filter(log => {
      const section = (() => {
        if (!log.date) return '';
        const day = new Date(log.date).getDate();
        if (day >= 1 && day <= 10) return '1-10';
        if (day >= 11 && day <= 20) return '11-20';
        return '21-End';
      })();
      
      return (
        (filters.session === 'All' || log.session === filters.session) &&
        (filters.section === 'All' || section === filters.section) &&
        (!filters.month || (log.date && log.date.startsWith(filters.month)))
      );
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#f8fafc', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Farmer Records</h2>
      
      {/* Search Section */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 24, marginBottom: 32, boxShadow: '0 1px 4px #0001' }}>
        <h3 style={{ marginBottom: 16, textAlign: 'center' }}>Search Farmer Records</h3>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label htmlFor="farmer-id" style={{ marginBottom: 4, fontWeight: 500 }}>Farmer ID</label>
            <input 
              id="farmer-id" 
              value={filters.farmerId} 
              onChange={(e) => setFilters({ ...filters, farmerId: e.target.value })} 
              placeholder="Enter Farmer ID" 
              style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 150, textAlign: 'center' }}
            />
          </div>
          <button 
            onClick={fetchFarmerLogs} 
            disabled={loading}
            style={{ padding: 8, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', minWidth: 120, alignSelf: 'end', marginTop: 22 }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {getFarmerName(filters.farmerId) && (
          <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 500, color: '#2563eb' }}>
            Farmer: {getFarmerName(filters.farmerId)}
          </div>
        )}
      </div>

      {/* Filters */}
      {logs.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label htmlFor="filter-month" style={{ marginBottom: 4, fontWeight: 500 }}>Month</label>
            <input id="filter-month" name="month" type="month" value={filters.month} onChange={handleChange} placeholder="Month" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 140, textAlign: 'center' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label htmlFor="filter-session" style={{ marginBottom: 4, fontWeight: 500 }}>Session</label>
            <select id="filter-session" name="session" value={filters.session} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120, textAlign: 'center' }}>
              {sessionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label htmlFor="filter-section" style={{ marginBottom: 4, fontWeight: 500 }}>Section</label>
            <select id="filter-section" name="section" value={filters.section} onChange={handleChange} style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 120, textAlign: 'center' }}>
              {sectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <button onClick={exportCSV} style={{ padding: 8, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', minWidth: 120, alignSelf: 'end', marginTop: 22 }}>Export to CSV</button>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}>Searching...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: 16, textAlign: 'center' }}>{error}</div>
      ) : logs.length === 0 && filters.farmerId ? (
        <div style={{ padding: 16, textAlign: 'center' }}>No records found for this farmer.</div>
      ) : filtered.length > 0 ? (
        <>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px #0001', marginTop: 8 }}>
            <thead>
              <tr style={{ background: '#2563eb', color: '#fff' }}>
                <th style={{ padding: 12, textAlign: 'center' }}>Session</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Section</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Quantity (L)</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Fat %</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Total Cost</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Entries</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr key={`${log.session}-${log.section}`} style={{ background: idx % 2 === 0 ? '#f1f5f9' : '#fff', transition: 'background 0.2s' }}>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.session}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.section}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.quantity_liters.toFixed(2)}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.fat_percent}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>₹{log.total_cost.toFixed(2)}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Summary */}
          <div style={{ marginTop: 24, fontWeight: 500, textAlign: 'center', fontSize: 18 }}>
            Total Milk: {totalMilk.toFixed(2)} L &nbsp; | &nbsp; Average Fat: {avgFat}% &nbsp; | &nbsp; Total Cost: ₹{totalCost.toFixed(2)}
          </div>

          {/* Detailed Entries Section */}
          <div style={{ marginTop: 32, background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px #0001' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Detailed Entries ({sortedEntries.length})</h3>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                style={{ padding: 8, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', minWidth: 120 }}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {showDetails && sortedEntries.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px #0001' }}>
                <thead>
                  <tr style={{ background: '#1e40af', color: '#fff' }}>
                    <th style={{ padding: 12, textAlign: 'center' }}>Date</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Session</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Section</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Quantity (L)</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Fat %</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Rate</th>
                    <th style={{ padding: 12, textAlign: 'center' }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry, idx) => {
                    const section = (() => {
                      if (!entry.date) return '';
                      const day = new Date(entry.date).getDate();
                      if (day >= 1 && day <= 10) return '1-10';
                      if (day >= 11 && day <= 20) return '11-20';
                      return '21-End';
                    })();
                    
                    return (
                      <tr key={entry.log_id || entry._id || entry.id} style={{ background: idx % 2 === 0 ? '#f1f5f9' : '#fff', transition: 'background 0.2s' }}>
                        <td style={{ padding: 10, textAlign: 'center' }}>{entry.date ? entry.date.slice(0, 10) : ''}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>{entry.session}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>{section}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>{(entry.quantity_liters || entry.quantity || 0).toFixed(2)}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>{entry.fat_percent || entry.fat || ''}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>{entry.rate_per_liter || entry.rate || ''}</td>
                        <td style={{ padding: 10, textAlign: 'center' }}>₹{(entry.total_cost || entry.total || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            
            {showDetails && sortedEntries.length === 0 && (
              <div style={{ textAlign: 'center', padding: 16, color: '#6b7280' }}>
                No entries found for the selected filters.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default ViewFarmerRecords; 