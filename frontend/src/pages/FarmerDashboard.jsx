import React, { useState } from 'react';

const mockMilkLogs = [
  // Example mock data
  { date: '2025-07-20', section: '1–10', session: 'Morning', quantity: 12 },
  { date: '2025-07-19', section: '1–10', session: 'Evening', quantity: 10 },
  { date: '2025-07-18', section: '11–20', session: 'Morning', quantity: 11 },
  { date: '2025-07-17', section: '21–End', session: 'Evening', quantity: 13 },
  { date: '2025-07-16', section: '1–10', session: 'Morning', quantity: 9 },
  { date: '2025-07-15', section: '11–20', session: 'Evening', quantity: 14 },
  { date: '2025-07-14', section: '21–End', session: 'Morning', quantity: 8 },
  { date: '2025-07-13', section: '1–10', session: 'Evening', quantity: 10 },
  { date: '2025-07-12', section: '11–20', session: 'Morning', quantity: 12 },
  { date: '2025-07-11', section: '21–End', session: 'Evening', quantity: 11 },
  { date: '2025-07-10', section: '1–10', session: 'Morning', quantity: 13 },
];

const sectionOptions = ['1–10', '11–20', '21–End'];
const sessionOptions = ['All', 'Morning', 'Evening'];

function FarmerDashboard() {
  const [month, setMonth] = useState('2025-07');
  const [section, setSection] = useState('All');
  const [session, setSession] = useState('All');

  // Filter logic
  const filteredLogs = mockMilkLogs
    .filter(log => log.date.startsWith(month))
    .filter(log => section === 'All' ? true : log.section === section)
    .filter(log => session === 'All' ? true : log.session === session)
    .slice(0, 10);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <h1 style={{ textAlign: 'center' }}>🧾 Milk Log View</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label>Month:{' '}
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              style={{ padding: 6, fontSize: 16 }}
            />
          </label>
        </div>
        <div>
          <label>Section:{' '}
            <select value={section} onChange={e => setSection(e.target.value)} style={{ padding: 6, fontSize: 16 }}>
              <option value="All">All</option>
              {sectionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label>Session:{' '}
            <select value={session} onChange={e => setSession(e.target.value)} style={{ padding: 6, fontSize: 16 }}>
              {sessionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Date</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Section</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Session</th>
            <th style={{ padding: 8, border: '1px solid #eee' }}>Quantity (L)</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.length === 0 ? (
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 16 }}>No records found.</td></tr>
          ) : (
            filteredLogs.map((log, idx) => (
              <tr key={idx}>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{log.date}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{log.section}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{log.session}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{log.quantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 16, color: '#888', fontSize: 14 }}>
        Showing last {filteredLogs.length} entries for selected filters.
      </div>
    </div>
  );
}

export default FarmerDashboard; 