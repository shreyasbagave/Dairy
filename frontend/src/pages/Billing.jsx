import { useEffect, useMemo, useState } from 'react';
import { apiCall } from '../utils/api';
import { formatDDMMYYYY, formatYYYYMM, getCurrentMonth } from '../utils/dateUtils';

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
  const [month, setMonth] = useState(getCurrentMonth()); // YYYY-MM
  const [section, setSection] = useState('1–10');
  const { start: periodStart, end: periodEnd } = computeSectionDates(month, section);
  const [preview, setPreview] = useState(null);
  const [balance, setBalance] = useState(null);
  const [deduction, setDeduction] = useState('');
  const [actualPaidAmount, setActualPaidAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const remaining = useMemo(() => {
    return balance?.balance?.remaining ?? 0;
  }, [balance]);

  const netPayable = useMemo(() => {
    if (!preview) return 0;
    return (preview.milk?.milk_total_amount || 0) - (Number(deduction || 0)) + (preview.previousCarryForward || 0);
  }, [preview, deduction]);

  useEffect(() => {
    if (!farmerId) return;
    (async () => {
      try {
        const res = await apiCall(`/api/billing/balance/${encodeURIComponent(farmerId)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('Balance fetch error:', errorData.message || `HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        setBalance(data);
      } catch (e) {
        console.error('Balance fetch error:', e);
      }
    })();
  }, [farmerId]);

  useEffect(() => {
    if (!farmerId) return;
    (async () => {
      try {
        const res = await apiCall(`/api/billing/history/${encodeURIComponent(farmerId)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('History fetch error:', errorData.message || `HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        setHistory(data.bills || []);
      } catch (e) {
        console.error('History fetch error:', e);
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
      // Reset form fields
      setDeduction('');
      setActualPaidAmount('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!actualPaidAmount || isNaN(actualPaidAmount)) {
      alert('Please enter the actual paid amount before generating the bill');
      return;
    }

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
          actual_paid_amount: Number(actualPaidAmount),
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // refresh
      setPreview(null);
      const bRes = await apiCall(`/api/billing/balance/${encodeURIComponent(farmerId)}`);
      setBalance(await bRes.json());
      const hRes = await apiCall(`/api/billing/history/${encodeURIComponent(farmerId)}`);
      const hData = await hRes.json();
      setHistory(hData.bills || []);
      setDeduction('');
      setActualPaidAmount('');
      alert('Bill generated successfully!');
    } catch (e) {
      console.error('Generate bill error:', e);
      setError(e.message || 'Failed to generate bill. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePayment(billId) {
    if (!paymentAmount || isNaN(paymentAmount)) {
      alert('Please enter a valid payment amount');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await apiCall(`/api/billing/payment/${encodeURIComponent(billId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          actual_paid_amount: Number(paymentAmount)
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      // Refresh history
      const hRes = await apiCall(`/api/billing/history/${encodeURIComponent(farmerId)}`);
      const hData = await hRes.json();
      setHistory(hData.bills || []);
      
      // Reset editing state
      setEditingPayment(null);
      setPaymentAmount('');
      
      alert(`Payment updated! Adjustment: ${data.adjustment >= 0 ? '+' : ''}₹${data.adjustment.toFixed(2)}`);
    } catch (e) {
      console.error('Update payment error:', e);
      setError(e.message || 'Failed to update payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(billId) {
    if (!billId) return;
    if (!window.confirm('Delete this bill? This will not change past feed balance deductions already accounted across remaining calculations, but removes this snapshot.')) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiCall(`/api/billing/${encodeURIComponent(billId)}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      await res.json().catch(() => ({}));
      // refresh
      const bRes = await apiCall(`/api/billing/balance/${encodeURIComponent(farmerId)}`);
      setBalance(await bRes.json());
      const hRes = await apiCall(`/api/billing/history/${encodeURIComponent(farmerId)}`);
      const hData = await hRes.json();
      setHistory(hData.bills || []);
    } catch (e) {
      console.error('Delete bill error:', e);
      setError(e.message || 'Failed to delete bill. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function startEditingPayment(bill) {
    setEditingPayment(bill.bill_id);
    setPaymentAmount(bill.actual_paid_amount > 0 ? bill.actual_paid_amount.toString() : '');
  }

  function cancelEditingPayment() {
    setEditingPayment(null);
    setPaymentAmount('');
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Billing System</h2>
      <div style={{ display: 'grid', gap: 16, maxWidth: 1200 }}>
        {/* Farmer Selection */}
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Farmer Selection</h3>
          <input 
            placeholder="Enter Farmer ID" 
            value={farmerId} 
            onChange={e => setFarmerId(e.target.value)}
            style={{ width: '200px', padding: '8px', fontSize: '14px' }}
          />
          {farmerId && (
            <div style={{ marginTop: 8, fontSize: '14px', color: '#666' }}>
              {loading ? 'Loading farmer data...' : 'Enter a valid Farmer ID to proceed'}
            </div>
          )}
        </div>

        {/* Period Selection */}
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Period Selection</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Month</label>
              <input 
                type="month" 
                value={month} 
                onChange={e => setMonth(e.target.value)}
                style={{ padding: '8px', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Section</label>
              <select 
                value={section} 
                onChange={e => setSection(e.target.value)}
                style={{ padding: '8px', fontSize: '14px', minWidth: '100px' }}
              >
                <option value="1–10">1–10</option>
                <option value="11–20">11–20</option>
                <option value="21–End">21–End</option>
              </select>
            </div>
            <div style={{ fontSize: 14, color: '#555', fontWeight: 'bold' }}>
              {periodStart && periodEnd ? `Period: ${formatDDMMYYYY(periodStart)} → ${formatDDMMYYYY(periodEnd)}` : ''}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            border: '2px solid #dc3545', 
            padding: 16, 
            borderRadius: 8, 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            textAlign: 'center'
          }}>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError('')}
              style={{ 
                marginLeft: 12, 
                padding: '4px 8px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Preview Button */}
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={handlePreview} 
            disabled={!farmerId || loading}
            style={{ 
              padding: '12px 24px', 
              fontSize: '16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'Preview Bill'}
          </button>
        </div>

        {/* Bill Preview */}
        {preview && (
          <div style={{ border: '2px solid #28a745', padding: 20, borderRadius: 8, backgroundColor: '#f8fff9' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#28a745' }}>📋 Bill Preview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: 6, border: '1px solid #ddd' }}>
                <strong>Period:</strong><br />
                {formatDDMMYYYY(periodStart)} → {formatDDMMYYYY(periodEnd)}
              </div>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: 6, border: '1px solid #ddd' }}>
                <strong>Milk Liters:</strong><br />
                {preview.milk?.milk_total_liters ?? 0} L
              </div>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: 6, border: '1px solid #ddd' }}>
                <strong>Milk Amount:</strong><br />
                ₹{Number(preview.milk?.milk_total_amount ?? 0).toFixed(2)}
              </div>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: 6, border: '1px solid #ddd' }}>
                <strong>Feed Balance:</strong><br />
                ₹{Number(preview.feedBalance?.remaining ?? 0).toFixed(2)}
              </div>
              <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: 6, border: '1px solid #ddd' }}>
                <strong>Previous Carry-Forward:</strong><br />
                ₹{Number(preview.previousCarryForward ?? 0).toFixed(2)}
              </div>
              <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: 6, border: '2px solid #2196f3' }}>
                <strong style={{ color: '#1976d2' }}>Net Payable:</strong><br />
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
                  ₹{netPayable.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bill Generation Form */}
        {preview && (
          <div style={{ border: '2px solid #ff9800', padding: 20, borderRadius: 8, backgroundColor: '#fff8e1' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#f57c00' }}>💰 Generate Bill</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Feed Deduction (₹)</label>
                <input
                  type="number"
                  min={0}
                  max={Math.max(0, remaining)}
                  step={0.01}
                  value={deduction}
                  onChange={e => setDeduction(e.target.value)}
                  placeholder="Enter deduction amount"
                  style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: 4 }}
                />
                <small style={{ color: '#666' }}>Available: ₹{remaining.toFixed(2)}</small>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Actual Paid Amount (₹)</label>
                <input
                  type="number"
                  step={0.01}
                  value={actualPaidAmount}
                  onChange={e => setActualPaidAmount(e.target.value)}
                  placeholder="Enter actual paid amount"
                  style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: 4 }}
                />
                <small style={{ color: '#666' }}>Net Payable: ₹{netPayable.toFixed(2)}</small>
              </div>
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button 
                onClick={handleGenerate} 
                disabled={!farmerId || loading || !actualPaidAmount}
                style={{ 
                  padding: '12px 32px', 
                  fontSize: '16px', 
                  backgroundColor: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Generating...' : 'Generate Bill'}
              </button>
            </div>
            {error && <div style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</div>}
          </div>
        )}

        {/* Billing History */}
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>📊 Billing History</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No billing history found for this farmer
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>Bill Date</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>Period</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>Milk Total</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>Feed Deducted</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>Prev Carry-Forward</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>Net Payable</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>Actual Paid</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>Adjustment</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>New Carry-Forward</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                    <th style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(b => (
                    <tr key={b.bill_id} style={{ backgroundColor: b.status === 'paid' ? '#f8fff9' : '#fff8e1' }}>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6' }}>
                        {formatDDMMYYYY(b.createdAt)}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6' }}>
                        {formatDDMMYYYY(b.period_start)} - {formatDDMMYYYY(b.period_end)}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{Number(b.milk_total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                        ₹{Number(b.feed_deducted_this_cycle).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                        ₹{Number(b.previous_carry_forward || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{Number(b.net_payable).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                        {editingPayment === b.bill_id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            style={{ width: '80px', padding: '4px', fontSize: '12px' }}
                          />
                        ) : (
                          b.actual_paid_amount > 0 ? `₹${Number(b.actual_paid_amount).toFixed(2)}` : 'Not paid'
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                        {b.adjustment !== undefined ? (
                          <span style={{ 
                            color: b.adjustment >= 0 ? '#28a745' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            {b.adjustment >= 0 ? '+' : ''}₹{Number(b.adjustment).toFixed(2)}
                          </span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                        {b.new_carry_forward_balance !== undefined ? 
                          `₹${Number(b.new_carry_forward_balance).toFixed(2)}` : '-'}
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        <span style={{ 
                          color: b.status === 'paid' ? '#28a745' : '#ff9800',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: b.status === 'paid' ? '#d4edda' : '#fff3cd'
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        {editingPayment === b.bill_id ? (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleUpdatePayment(b.bill_id)}
                              disabled={loading}
                              style={{ 
                                fontSize: '11px', 
                                padding: '4px 8px', 
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                            <button 
                              onClick={cancelEditingPayment}
                              style={{ 
                                fontSize: '11px', 
                                padding: '4px 8px', 
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button 
                              onClick={() => startEditingPayment(b)}
                              disabled={loading}
                              style={{ 
                                fontSize: '11px', 
                                padding: '4px 8px', 
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                            >
                              {b.status === 'paid' ? 'Edit' : 'Enter Payment'}
                            </button>
                            <button 
                              onClick={() => handleDelete(b.bill_id)} 
                              disabled={loading}
                              style={{ 
                                fontSize: '11px', 
                                padding: '4px 8px', 
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


