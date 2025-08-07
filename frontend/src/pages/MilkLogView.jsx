import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

const sectionOptions = ['All', '1-10', '11-20', '21-End'];
const sessionOptions = ['All', 'Morning', 'Evening'];

function MilkLogView() {
  // Set current month as default
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const [filters, setFilters] = useState({
    month: currentMonth, // Set current month as default
    session: 'Morning', // Default session to Morning
    section: '1-10', // Default section to 1-10
    farmer: '',
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const response = await apiCall('/admin/milk-logs', {
          method: 'GET'
        });

        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          setError('Failed to fetch logs');
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        setError('Error fetching logs');
      } finally {
        setLoading(false);
      }
    };

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

    fetchLogs();
    fetchFarmers();
  }, []);

  // Function to get farmer name by farmer_id
  const getFarmerName = (farmerId) => {
    const farmer = farmers.find(f => f.farmer_id === farmerId);
    return farmer ? farmer.name : '';
  };

  const handleChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  // Group logs by farmer_id, section, and session
  const groupedLogs = logs.reduce((groups, log) => {
    const logDate = log.date ? log.date.slice(0, 10) : '';
    const farmerId = log.farmer_id || log.farmerId || '';
    const section = (() => {
      if (!log.date) return '';
      const day = new Date(log.date).getDate();
      if (day >= 1 && day <= 10) return '1-10';
      if (day >= 11 && day <= 20) return '11-20';
      return '21-End';
    })();
    
    const key = `${farmerId}-${section}-${log.session}`;
    
    if (!groups[key]) {
      groups[key] = {
        farmer_id: farmerId,
        farmer_name: getFarmerName(farmerId),
        section: section,
        session: log.session,
        date: logDate,
        quantity_liters: 0,
        fat_percent: 0,
        total_cost: 0,
        count: 0
      };
    }
    
    groups[key].quantity_liters += log.quantity_liters || log.quantity || 0;
    groups[key].fat_percent += log.fat_percent || log.fat || 0;
    groups[key].total_cost += log.total_cost || log.total || 0;
    groups[key].count += 1;
    
    return groups;
  }, {});

  // Calculate average fat for each group and format quantities to 2 decimal places
  Object.values(groupedLogs).forEach(group => {
    group.fat_percent = group.count > 0 ? (group.fat_percent / group.count).toFixed(2) : 0;
    group.quantity_liters = parseFloat(group.quantity_liters).toFixed(2);
    group.total_cost = parseFloat(group.total_cost).toFixed(2);
  });

  const filtered = Object.values(groupedLogs).filter(log => {
    const farmerId = log.farmer_id || log.farmerId || '';
    const name = log.farmer_name || '';
    return (
      (!filters.month || log.date.startsWith(filters.month)) &&
      (filters.session === 'All' || log.session === filters.session) &&
      (filters.section === 'All' || log.section === filters.section) &&
      (!filters.farmer || farmerId === filters.farmer || name.toLowerCase().includes(filters.farmer.toLowerCase()))
    );
  });

  // Sort filtered results by farmer_id in ascending order
  const sortedFiltered = filtered.sort((a, b) => {
    const farmerIdA = parseInt(a.farmer_id) || 0;
    const farmerIdB = parseInt(b.farmer_id) || 0;
    return farmerIdA - farmerIdB;
  });

  const totalMilk = sortedFiltered.reduce((sum, l) => sum + parseFloat(l.quantity_liters || l.quantity || 0), 0);
  const totalCost = sortedFiltered.reduce((sum, l) => sum + parseFloat(l.total_cost || l.total || 0), 0);

  const exportCSV = () => {
    if (sortedFiltered.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Create CSV content
    const headers = ['Farmer ID', 'Name', 'Section', 'Session', 'Quantity (L)', 'Fat %', 'Total'];
    const csvContent = [
      headers.join(','),
      ...sortedFiltered.map(log => {
        const farmerId = log.farmer_id || log.farmerId || '';
        const name = log.farmer_name || '';
        return [
          farmerId,
          name,
          log.section,
          log.session,
          log.quantity_liters || log.quantity || '',
          log.fat_percent || log.fat || '',
          log.total_cost || log.total || ''
        ].join(',');
      })
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `milk_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', background: '#f8fafc', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Milk Log View</h2>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label htmlFor="filter-farmer" style={{ marginBottom: 4, fontWeight: 500 }}>Farmer ID/Name</label>
          <input id="filter-farmer" name="farmer" value={filters.farmer} onChange={handleChange} placeholder="Farmer ID or Name" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc', minWidth: 180, textAlign: 'center' }} />
        </div>
        <button onClick={exportCSV} style={{ padding: 8, borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', minWidth: 120, alignSelf: 'end', marginTop: 22 }}>Export to CSV</button>
      </div>
      {loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red', padding: 16, textAlign: 'center' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px #0001', marginTop: 8 }}>
          <thead>
            <tr style={{ background: '#2563eb', color: '#fff' }}>
              <th style={{ padding: 12, textAlign: 'center' }}>Farmer ID</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Name</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Section</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Session</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Quantity (L)</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Fat %</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>No records found.</td></tr>
            ) : (
              sortedFiltered.map((log, idx) => (
                <tr key={`${log.farmer_id}-${log.section}-${log.session}`} style={{ background: idx % 2 === 0 ? '#f1f5f9' : '#fff', transition: 'background 0.2s' }}>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.farmer_id}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.farmer_name}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.section}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.session}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.quantity_liters}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.fat_percent}</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>{log.total_cost}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: 24, fontWeight: 500, textAlign: 'center', fontSize: 18 }}>
        Total Milk: {totalMilk.toFixed(2)} L &nbsp; | &nbsp; Total Cost: ₹{totalCost.toFixed(2)}
      </div>
    </div>
  );
}
export default MilkLogView; 