import { useEffect, useMemo, useState } from 'react';
import { apiCall } from '../utils/api';

function toISODate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function computeSectionDates(monthYYYYMM, section) {
  if (!monthYYYYMM) return { start: '', end: '' };
  const startOfMonth = new Date(`${monthYYYYMM}-01`);
  const year = startOfMonth.getFullYear();
  const month = startOfMonth.getMonth();
  let startDay = 1;
  let endDay = 10;
  if (section === '11–20') {
    startDay = 11; endDay = 20;
  } else if (section === '21–End') {
    startDay = 21;
    // last day of month
    endDay = new Date(year, month + 1, 0).getDate();
  }
  const start = new Date(year, month, startDay);
  const end = new Date(year, month, endDay);
  return { start: toISODate(start), end: toISODate(end) };
}

export default function Billing() {
  const [farmerId, setFarmerId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [section, setSection] = useState('1–10');
  const { start: periodStart, end: periodEnd } = computeSectionDates(month, section);
  const [preview, setPreview] = useState(null);
  const [balance, setBalance] = useState(null);
  const [deduction, setDeduction] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const remaining = useMemo(() => {
    return balance?.balance?.remaining ?? 0;
  }, [balance]);

  useEffect(() => {
    if (!farmerId) return;
    (async () => {
      try {
        const res = await apiCall(`/api/billing/balance/${encodeURIComponent(farmerId)}`);
        const data = await res.json();
        setBalance(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [farmerId]);

  useEffect(() => {
    if (!farmerId) return;
    (async () => {
      try {
        const res = await apiCall(`/api/billing/history/${encodeURIComponent(farmerId)}`);
        const data = await res.json();
        setHistory(data.bills || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [farmerId]);

  async function handlePreview() {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('/api/billing/preview', {
        method: 'POST',
        body: JSON.stringify({
          farmer_id: farmerId,
          period_start: periodStart,
          period_end: periodEnd,
        }),
      });
      const data = await res.json();
      setPreview(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const res = await apiCall('/api/billing/generate', {
        method: 'POST',
        body: JSON.stringify({
          farmer_id: farmerId,
          period_start: periodStart,
          period_end: periodEnd,
          feed_deduction: Number(deduction || 0),
        }),
      });
      const data = await res.json();
      // refresh
      setPreview(null);
      const bRes = await apiCall(`/api/billing/balance/${encodeURIComponent(farmerId)}`);
      setBalance(await bRes.json());
      const hRes = await apiCall(`/api/billing/history/${encodeURIComponent(farmerId)}`);
      const hData = await hRes.json();
      setHistory(hData.bills || []);
      setDeduction('');
      alert('Bill generated');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Billing</h2>
      <div style={{ display: 'grid', gap: 12, maxWidth: 700 }}>
        <input placeholder="Farmer ID" value={farmerId} onChange={e => setFarmerId(e.target.value)} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div>
            <label>Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <label>Section</label>
            <select value={section} onChange={e => setSection(e.target.value)}>
              <option value="1–10">1–10</option>
              <option value="11–20">11–20</option>
              <option value="21–End">21–End</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end', fontSize: 12, color: '#555' }}>
            {periodStart && periodEnd ? `Period: ${periodStart} → ${periodEnd}` : ''}
          </div>
        </div>
        <button onClick={handlePreview} disabled={!farmerId || loading}>Preview</button>
        {preview && (
          <div style={{ border: '1px solid #ddd', padding: 12 }}>
            <h3>Preview</h3>
            <div>Milk Liters: {preview.milk?.milk_total_liters ?? 0}</div>
            <div>Milk Amount: {preview.milk?.milk_total_amount ?? 0}</div>
            <div>Feed Balance: {preview.feedBalance?.remaining ?? 0}</div>
          </div>
        )}
        <div style={{ border: '1px solid #ddd', padding: 12 }}>
          <h3>Deduction</h3>
          <div>Current Feed Balance: {remaining}</div>
          <input
            type="number"
            min={0}
            max={Math.max(0, remaining)}
            step={0.01}
            value={deduction}
            onChange={e => setDeduction(e.target.value)}
            placeholder="Deduct this cycle"
          />
          <button onClick={handleGenerate} disabled={!farmerId || loading}>Generate Bill</button>
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
        <div style={{ border: '1px solid #ddd', padding: 12 }}>
          <h3>History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Period</th>
                  <th>Milk Total</th>
                  <th>Deducted</th>
                  <th>Remaining Feed</th>
                  <th>Net Payable</th>
                </tr>
              </thead>
              <tbody>
                {history.map(b => (
                  <tr key={b.bill_id}>
                    <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td>{new Date(b.period_start).toLocaleDateString()} - {new Date(b.period_end).toLocaleDateString()}</td>
                    <td>{b.milk_total_amount}</td>
                    <td>{b.feed_deducted_this_cycle}</td>
                    <td>{b.remaining_feed_balance_after}</td>
                    <td>{b.net_payable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


