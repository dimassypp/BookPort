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
    totalFailed: 0,
    totalCancelled: 0,
    totalRefunded: 0
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

      const totalRevenue = res.data
        .filter(t => t.status_pembayaran === 'paid' && t.status_pesanan !== 'cancelled')
        .reduce((sum, t) => sum + t.total_harga, 0);
      
      const totalPaid = res.data
        .filter(t => t.status_pembayaran === 'paid' && t.status_pesanan !== 'cancelled')
        .length;
      
      const totalPending = res.data
        .filter(t => t.status_pembayaran === 'pending' && t.status_pesanan !== 'cancelled')
        .length;
      
      const totalFailed = res.data
        .filter(t => t.status_pembayaran === 'failed')
        .length;

      const totalCancelled = res.data
        .filter(t => t.status_pesanan === 'cancelled')
        .length;

      const totalRefunded = res.data
        .filter(t => t.status_pembayaran === 'refunded')
        .length;

      setStats({ 
        totalRevenue, 
        totalPaid, 
        totalPending, 
        totalFailed,
        totalCancelled,
        totalRefunded
      });
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'cancelled') return t.status_pesanan === 'cancelled';
    if (filter === 'refunded') return t.status_pembayaran === 'refunded';
    return t.status_pembayaran === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      paid: { bg: '#d4edda', color: '#155724', text: 'Paid' },
      pending: { bg: '#fff3cd', color: '#856404', text: 'Pending' },
      failed: { bg: '#f8d7da', color: '#721c24', text: 'Failed' },
      refunded: { bg: '#e7e7ff', color: '#4a4a9e', text: 'Refunded' }
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0066cc',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#666' }}>Loading transactions...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '0.5rem' }}>Transaksi</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Kelola semua transaksi pelanggan di sini
          </p>
        </div>
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Total Pendapatan</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            Rp {stats.totalRevenue.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '0.25rem' }}>
            Exclude cancelled orders
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #28a745'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Paid</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{stats.totalPaid}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '0.25rem' }}>
            Transaksi berhasil
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #ffc107'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Pending</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>{stats.totalPending}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '0.25rem' }}>
            Menunggu pembayaran
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #dc3545'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Failed</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>{stats.totalFailed}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '0.25rem' }}>
            Pembayaran gagal
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #6c757d'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Cancelled</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6c757d' }}>{stats.totalCancelled}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '0.25rem' }}>
            Pesanan dibatalkan
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #4a4a9e'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>Refunded</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a4a9e' }}>{stats.totalRefunded}</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '0.25rem' }}>
            Perlu proses refund
          </div>
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexWrap: 'wrap'
      }}>
        {['all', 'paid', 'pending', 'failed', 'cancelled', 'refunded'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: filter === f ? '#0066cc' : '#e9ecef',
              color: filter === f ? '#fff' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: filter === f ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (filter !== f) e.target.style.backgroundColor = '#d0d0d0';
            }}
            onMouseOut={(e) => {
              if (filter !== f) e.target.style.backgroundColor = '#e9ecef';
            }}
          >
            {f === 'all' ? 'Semua' : f}
          </button>
        ))}
      </div>

      {/* Info Banner */}
      {filter === 'refunded' && stats.totalRefunded > 0 && (
        <div style={{
          marginBottom: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffecb5',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '24px' }}>!!</span>
          <div>
            <strong style={{ color: '#856404' }}>Perhatian:</strong>
            <span style={{ color: '#856404', marginLeft: '0.5rem' }}>
              Ada {stats.totalRefunded} pesanan yang perlu di-refund manual via Midtrans Dashboard.
            </span>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Order ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Tanggal</th>
                <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Total</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Payment</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Order Status</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Blockchain</th>
                <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: transaction.status_pesanan === 'cancelled' ? '#f8f9fa' : '#fff'
                  }}
                >
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '12px' }}>
                    #{transaction.id}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500' }}>{transaction.user_nama}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{transaction.user_email}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '14px' }}>
                    {new Date(transaction.created_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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
                        style={{ 
                          color: '#0066cc', 
                          fontSize: '12px',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <Link to={`/admin/transactions/${transaction.id}`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#0066cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#0052a3'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#0066cc'}
                      >
                        View Detail
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#666',
          backgroundColor: '#fff',
          borderRadius: '8px',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📭</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '0.5rem' }}>
            Tidak ada transaksi
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Tidak ada transaksi dengan filter "{filter}"
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;