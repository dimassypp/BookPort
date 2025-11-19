import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminTransactionsPage = () => {
  const { token } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPaid: 0,
    totalPending: 0,
    totalFailed: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/pesanan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);

      // Calculate stats
      const totalRevenue = res.data
        .filter(t => t.status_pembayaran === 'paid')
        .reduce((sum, t) => sum + t.total_harga, 0);
      
      const totalPaid = res.data.filter(t => t.status_pembayaran === 'paid').length;
      const totalPending = res.data.filter(t => t.status_pembayaran === 'pending').length;
      const totalFailed = res.data.filter(t => t.status_pembayaran === 'failed').length;

      setStats({ totalRevenue, totalPaid, totalPending, totalFailed });
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status_pembayaran === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      paid: { bg: '#d4edda', color: '#155724', text: 'Paid' },
      pending: { bg: '#fff3cd', color: '#856404', text: 'Pending' },
      failed: { bg: '#f8d7da', color: '#721c24', text: 'Failed' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        backgroundColor: style.bg,
        color: style.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    );
  };

  const getOrderStatusBadge = (status) => {
    const styles = {
      'waiting payment': { bg: '#fff3cd', color: '#856404', text: 'Waiting Payment' },
      'processing': { bg: '#cfe2ff', color: '#084298', text: 'Processing' },
      'shipped': { bg: '#e2e3e5', color: '#383d41', text: 'Shipped' },
      'paid': { bg: '#d1e7dd', color: '#0f5132', text: 'Paid' },
      'completed': { bg: '#d4edda', color: '#155724', text: 'Completed' },
      'cancelled': { bg: '#f8d7da', color: '#721c24', text: 'Cancelled' }
    };
    const style = styles[status] || styles['waiting payment'];
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        backgroundColor: style.bg,
        color: style.color,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '32px' }}>Transaksi</h1>
        <Link to="/admin">
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            ← Dashboard
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Total Pendapatan</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Paid</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.totalPaid}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Pending</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{stats.totalPending}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Failed</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.totalFailed}</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        backgroundColor: '#fff',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {['all', 'paid', 'pending', 'failed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === f ? '#0066cc' : '#e9ecef',
              color: filter === f ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Order ID</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Tanggal</th>
              <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Total</th>
              <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Payment</th>
              <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Order Status</th>
              <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Blockchain</th>
              <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '12px' }}>
                  #{transaction.id}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: '500' }}>{transaction.user_nama}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{transaction.user_email}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {new Date(transaction.created_at).toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                  Rp {transaction.total_harga.toLocaleString('id-ID')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {getStatusBadge(transaction.status_pembayaran)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {getOrderStatusBadge(transaction.status_pesanan)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {transaction.blockchain_tx_hash ? (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${transaction.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0066cc', fontSize: '12px' }}
                    >
                      View
                    </a>
                  ) : (
                    <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <Link to={`/admin/transactions/${transaction.id}`}>
                    <button style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#0066cc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      View Detail
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Tidak ada transaksi dengan filter "{filter}"
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;