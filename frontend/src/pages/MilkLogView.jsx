import React, { useState, useEffect, useMemo } from 'react';
import { apiCall } from '../utils/api';
import { getFarmerNameFromList, normalizeFarmerId } from '../utils/farmerDisplay';

/** YYYY-MM-DD from whatever the API stores (ISO string, Date, ms, Mongo $date). */
function toDateKey(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object' && value.$date != null) {
    return toDateKey(value.$date);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  }
  try {
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) return '';
    return new Date(t).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function monthFromDateKey(dateKey) {
  if (!dateKey || dateKey.length < 7) return '';
  return dateKey.slice(0, 7);
}

/** Section = calendar day-of-month on the stored milk date (from YYYY-MM-DD, no timezone shift). */
function calendarSectionFromDateKey(dateKey) {
  if (!dateKey || dateKey.length < 10) return '';
  const day = parseInt(dateKey.slice(8, 10), 10);
  if (Number.isNaN(day) || day < 1) return '';
  if (day <= 10) return '1-10';
  if (day <= 20) return '11-20';
  return '21-End';
}

function rawLogMatchesFilters(log, filters, farmers) {
  const dateKey = toDateKey(log.date);
  const logMonth = monthFromDateKey(dateKey);
  if (filters.month && logMonth !== filters.month) return false;

  const sess = String(log.session || '').trim().toLowerCase();
  if (filters.session !== 'All' && sess !== String(filters.session).trim().toLowerCase()) return false;

  const sec = calendarSectionFromDateKey(dateKey);
  if (filters.section !== 'All' && sec !== filters.section) return false;

  const fid = normalizeFarmerId(log.farmer_id ?? log.farmerId);
  const qRaw = (filters.farmer || '').trim();
  if (qRaw) {
    const name = (getFarmerNameFromList(farmers, fid) || '').trim();
    if (/^\d+$/.test(qRaw)) {
      const qn = normalizeFarmerId(qRaw);
      if (fid !== qn) return false;
    } else if (!name.toLowerCase().includes(qRaw.toLowerCase())) {
      return false;
    }
  }
  return true;
}

const sectionOptions = ['All', '1-10', '11-20', '21-End'];
const sessionOptions = ['All', 'Morning', 'Evening'];

function MilkLogView() {
  // Set current month as default
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const [filters, setFilters] = useState({
    month: currentMonth,
    session: 'All',
    section: 'All',
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

  const handleChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });

  const { sortedFiltered, logsAfterRawFilter } = useMemo(() => {
    const logsInFilter = logs.filter((log) => rawLogMatchesFilters(log, filters, farmers));

    const groupedLogs = logsInFilter.reduce((groups, log) => {
      const logDate = toDateKey(log.date);
      const farmerId = log.farmer_id ?? log.farmerId ?? '';
      const section = calendarSectionFromDateKey(logDate);
      const sessionKey = String(log.session || '').trim();

      const key = `${normalizeFarmerId(farmerId)}-${section}-${sessionKey}`;

      if (!groups[key]) {
        groups[key] = {
          farmer_id: farmerId,
          farmer_name: getFarmerNameFromList(farmers, farmerId),
          section,
          session: log.session,
          date: logDate,
          quantity_liters: 0,
          fat_percent: 0,
          total_cost: 0,
          count: 0,
        };
      }

      groups[key].quantity_liters += log.quantity_liters || log.quantity || 0;
      groups[key].fat_percent += log.fat_percent || log.fat || 0;
      groups[key].total_cost += log.total_cost || log.total || 0;
      groups[key].count += 1;

      return groups;
    }, {});

    Object.values(groupedLogs).forEach((group) => {
      group.fat_percent = group.count > 0 ? (group.fat_percent / group.count).toFixed(2) : 0;
      group.quantity_liters = parseFloat(group.quantity_liters).toFixed(2);
      group.total_cost = parseFloat(group.total_cost).toFixed(2);
    });

    const filtered = Object.values(groupedLogs);
    const sorted = [...filtered].sort((a, b) => {
      const farmerIdA = parseInt(a.farmer_id, 10) || 0;
      const farmerIdB = parseInt(b.farmer_id, 10) || 0;
      return farmerIdA - farmerIdB;
    });

    return { sortedFiltered: sorted, logsAfterRawFilter: logsInFilter };
  }, [logs, filters, farmers]);

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
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 16 }}>
                  <div>No rows match these filters.</div>
                  {logs.length > 0 && logsAfterRawFilter.length === 0 && (
                    <div style={{ marginTop: 10, fontSize: 14, color: '#64748b', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                      You have <strong>{logs.length}</strong> milk log(s) in total, but none match the current month / session / section / farmer filters.
                      <br />
                      <strong>Section</strong> uses the <strong>calendar day</strong> of each milk date (days 1–10, 11–20, 21–end). Try setting <strong>Section</strong> to <strong>All</strong> if you expect rows on other days of the month.
                    </div>
                  )}
                  {logs.length === 0 && (
                    <div style={{ marginTop: 8, color: '#64748b' }}>No milk logs loaded from the server.</div>
                  )}
                </td>
              </tr>
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