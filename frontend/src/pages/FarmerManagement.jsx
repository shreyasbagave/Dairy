import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';

function FarmerManagement() {
  const [farmers, setFarmers] = useState([]);
  const [form, setForm] = useState({ 
    id: '', 
    name: '', 
    phone: '', 
    address: '',
    accountNo: '',
    ifsc: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await apiCall('/admin/add-farmer', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        setMessage('Farmer added successfully!');
        setForm({ id: '', name: '', phone: '', address: '', accountNo: '', ifsc: '' });
        // Refresh the farmers list
        const refreshResponse = await apiCall('/admin/farmers', {
          method: 'GET'
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setFarmers(data);
        }
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to add farmer');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Error adding farmer:', error);
    }

    setLoading(false);
  };

  const handleEdit = id => {
    const farmer = farmers.find(f => f.farmer_id === id);
    setForm({ 
      id: farmer.farmer_id, 
      name: farmer.name, 
      phone: farmer.phone, 
      address: farmer.address || '',
      accountNo: farmer.bank_details?.account_no || '',
      ifsc: farmer.bank_details?.ifsc || ''
    });
    setEditingId(id);
  };

  const handleUpdate = async e => {
    e.preventDefault();
    if (!form.id || !form.name || !form.phone || !form.address || !form.accountNo || !form.ifsc) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/admin/edit-farmer/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ 
          name: form.name, 
          phone: form.phone, 
          address: form.address,
          bank_details: { 
            account_no: form.accountNo, 
            ifsc: form.ifsc 
          }
        })
      });
      if (res.ok) {
        const updatedFarmer = await res.json();
        setFarmers(farmers.map(f => f.farmer_id === form.id ? updatedFarmer : f));
        setForm({ id: '', name: '', phone: '', address: '', accountNo: '', ifsc: '' });
        setEditingId(null);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to update farmer');
      }
    } catch (err) {
      alert('Failed to update farmer');
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    const farmer = farmers.find(f => f.farmer_id === id);
    const confirmMessage = `Are you sure you want to delete farmer "${farmer?.name}" (ID: ${id})?\n\nThis will permanently delete:\n• The farmer profile\n• All milk logs for this farmer\n• Any user accounts linked to this farmer\n\nThis action cannot be undone!`;
    
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/admin/delete-farmer/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });
      if (res.ok) {
        const result = await res.json();
        setFarmers(farmers.filter(f => f.farmer_id !== id));
        alert(`✅ Farmer deleted successfully!\n\nDeleted:\n• Farmer: ${result.deletedFarmer.name}\n• Milk logs: ${result.deletedMilkLogs}\n• User accounts: ${result.deletedUserAccounts}`);
      } else {
        const errorData = await res.json();
        alert(`❌ Failed to delete farmer: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`❌ Network error: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      maxWidth: '100%', 
      margin: '0 auto', 
      background: '#f8fafc', 
      borderRadius: '12px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      padding: 'clamp(16px, 4vw, 32px)',
      overflow: 'hidden'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: 'clamp(16px, 4vw, 24px)',
        fontSize: 'clamp(1.5rem, 4vw, 2rem)',
        color: '#2d3748'
      }}>
        Farmer Management
      </h2>
      
      {/* Add/Edit Form */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '10px', 
        padding: 'clamp(16px, 4vw, 24px)', 
        marginBottom: 'clamp(20px, 5vw, 32px)', 
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)' 
      }}>
        <h3 style={{ 
          marginBottom: 'clamp(12px, 3vw, 16px)', 
          textAlign: 'center',
          fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
          color: '#2d3748'
        }}>
          {editingId ? 'Edit Farmer' : 'Add New Farmer'}
        </h3>
        <form onSubmit={editingId ? handleUpdate : handleSubmit} style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'clamp(8px, 2vw, 12px)',
          alignItems: 'end'
        }} className="form-grid">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="farmer-id" style={{ 
              marginBottom: '4px', 
              fontWeight: '500',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#2d3748'
            }}>
              Farmer ID
            </label>
            <input 
              id="farmer-id" 
              name="id" 
              value={form.id} 
              onChange={handleChange} 
              placeholder="e.g. F123" 
              required 
              style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                borderRadius: '6px', 
                border: '1px solid #ccc', 
                fontSize: 'clamp(14px, 3vw, 16px)',
                minHeight: '44px'
              }} 
              disabled={!!editingId} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="farmer-name" style={{ 
              marginBottom: '4px', 
              fontWeight: '500',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#2d3748'
            }}>
              Name
            </label>
            <input 
              id="farmer-name" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Farmer Name" 
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="farmer-phone" style={{ 
              marginBottom: '4px', 
              fontWeight: '500',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#2d3748'
            }}>
              Phone
            </label>
            <input 
              id="farmer-phone" 
              name="phone" 
              value={form.phone} 
              onChange={handleChange} 
              placeholder="Phone Number" 
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="farmer-address" style={{ 
              marginBottom: '4px', 
              fontWeight: '500',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#2d3748'
            }}>
              Address
            </label>
            <input 
              id="farmer-address" 
              name="address" 
              value={form.address} 
              onChange={handleChange} 
              placeholder="Address" 
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="farmer-account" style={{ 
              marginBottom: '4px', 
              fontWeight: '500',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#2d3748'
            }}>
              Account No
            </label>
            <input 
              id="farmer-account" 
              name="accountNo" 
              value={form.accountNo} 
              onChange={handleChange} 
              placeholder="Account Number" 
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="farmer-ifsc" style={{ 
              marginBottom: '4px', 
              fontWeight: '500',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              color: '#2d3748'
            }}>
              IFSC Code
            </label>
            <input 
              id="farmer-ifsc" 
              name="ifsc" 
              value={form.ifsc} 
              onChange={handleChange} 
              placeholder="IFSC Code" 
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
          <div style={{ display: 'flex', gap: '8px', gridColumn: '1 / -1' }}>
            <button 
              type="submit" 
              style={{ 
                padding: 'clamp(8px, 2vw, 12px)', 
                borderRadius: '6px', 
                background: '#2563eb', 
                color: '#fff', 
                border: 'none', 
                minWidth: '120px', 
                alignSelf: 'end', 
                marginTop: '22px',
                fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: '600',
                minHeight: '44px',
                cursor: 'pointer'
              }} 
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Add')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { 
                  setEditingId(null); 
                  setForm({ id: '', name: '', phone: '', address: '', accountNo: '', ifsc: '' }); 
                }} 
                style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  borderRadius: '6px', 
                  background: '#6b7280', 
                  color: '#fff', 
                  border: 'none', 
                  minWidth: '120px', 
                  alignSelf: 'end', 
                  marginTop: '22px',
                  fontSize: 'clamp(14px, 3vw, 16px)',
                  fontWeight: '600',
                  minHeight: '44px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        {message && (
          <div style={{ 
            marginTop: 'clamp(12px, 3vw, 16px)', 
            padding: 'clamp(8px, 2vw, 12px)', 
            borderRadius: '6px', 
            background: '#e2f3f5', 
            color: '#065f46', 
            border: '1px solid #a7f3d0', 
            fontSize: 'clamp(14px, 3vw, 16px)',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Farmers Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '10px', 
        padding: 'clamp(16px, 4vw, 24px)', 
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          marginBottom: 'clamp(12px, 3vw, 16px)', 
          textAlign: 'center',
          fontSize: 'clamp(1.1rem, 3vw, 1.3rem)',
          color: '#2d3748'
        }}>
          All Farmers
        </h3>
        <div style={{ overflowX: 'auto' }} className="table-container">
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate', 
            borderSpacing: 0, 
            borderRadius: '10px', 
            overflow: 'hidden', 
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            minWidth: '500px'
          }}>
            <thead>
              <tr style={{ background: '#2563eb', color: '#fff' }}>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  ID
                </th>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Name
                </th>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Phone
                </th>
                <th style={{ 
                  padding: 'clamp(8px, 2vw, 12px)', 
                  textAlign: 'center',
                  fontSize: 'clamp(12px, 2.5vw, 14px)'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f, idx) => (
                <tr key={f.farmer_id} style={{ 
                  background: idx % 2 === 0 ? '#f1f5f9' : '#fff', 
                  transition: 'background 0.2s' 
                }}>
                  <td style={{ 
                    padding: 'clamp(6px, 1.5vw, 10px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>
                    {f.farmer_id}
                  </td>
                  <td style={{ 
                    padding: 'clamp(6px, 1.5vw, 10px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>
                    {f.name}
                  </td>
                  <td style={{ 
                    padding: 'clamp(6px, 1.5vw, 10px)', 
                    textAlign: 'center',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}>
                    {f.phone}
                  </td>
                  <td style={{ 
                    padding: 'clamp(6px, 1.5vw, 10px)', 
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => handleEdit(f.farmer_id)} 
                        style={{ 
                          padding: 'clamp(4px, 1vw, 6px)', 
                          borderRadius: '4px', 
                          background: '#2563eb', 
                          color: '#fff', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontSize: 'clamp(11px, 2vw, 12px)',
                          minHeight: '32px',
                          minWidth: '60px'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(f.farmer_id)} 
                        style={{ 
                          padding: 'clamp(4px, 1vw, 6px)', 
                          borderRadius: '4px', 
                          background: '#dc2626', 
                          color: '#fff', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontSize: 'clamp(11px, 2vw, 12px)',
                          minHeight: '32px',
                          minWidth: '60px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {farmers.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: 'clamp(12px, 3vw, 16px)', 
            color: '#6b7280',
            fontSize: 'clamp(14px, 3vw, 16px)'
          }}>
            No farmers found. Add your first farmer above.
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerManagement; 
