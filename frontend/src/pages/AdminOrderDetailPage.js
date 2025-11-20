import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/pesanan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Error fetching detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Update status menjadi "${newStatus}"?`)) return;

    setUpdating(true);
    try {
      await axios.put(
        `http://localhost:5000/api/admin/pesanan/${id}/status`,
        { status_pesanan: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Status berhasil diupdate!');
      fetchDetail();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'waiting_payment': '#ffc107',
      'processing': '#0066cc',
      'shipped': '#0dcaf0',
      'completed': '#28a745',
      'cancelled': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Order not found</div>;
  }

  const { pesanan, detail } = data;
  const alamat = pesanan.alamat_pengiriman ? JSON.parse(pesanan.alamat_pengiriman) : {};

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '32px' }}>Order Detail #{pesanan.id}</h1>
        <Link to="/admin/transactions">
          <button style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            ← Back to Transactions
          </button>
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left - Order Info */}
        <div>
          {/* Customer Info */}
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem' }}>
              Customer Information
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{pesanan.user_nama}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Email</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{pesanan.user_email}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Phone</div>
                <div style={{ fontSize: '16px', fontWeight: '500' }}>{pesanan.user_phone || '-'}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem' }}>
              Shipping Address
            </h2>
            <div style={{ lineHeight: '1.6', color: '#333' }}>
              <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                {alamat.first_name} {alamat.last_name}
              </div>
              <div>{alamat.address}</div>
              <div>{alamat.city}, {alamat.postal_code}</div>
              <div>{alamat.country || 'Indonesia'}</div>
              <div style={{ marginTop: '0.5rem' }}>Phone: {alamat.phone_number}</div>
            </div>
          </div>

          {/* Order Items */}
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem' }}>
              Order Items
            </h2>
            {detail.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                {item.gambar_url ? (
                  <img
                    src={`http://localhost:5000${item.gambar_url}`}
                    alt={item.judul}
                    style={{
                      width: '80px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '80px',
                    height: '100px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '8px'
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {item.judul}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
                    Quantity: {item.jumlah}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>
                    Rp {item.harga_saat_beli.toLocaleString('id-ID')} x {item.jumlah}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: '600' }}>
                  Rp {(item.harga_saat_beli * item.jumlah).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Status & Actions */}
        <div>
          {/* Order Summary */}
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem' }}>
              Order Summary
            </h2>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Order ID</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>#{pesanan.id}</div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Midtrans Order ID</div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {pesanan.midtrans_order_id}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Date</div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                {new Date(pesanan.created_at).toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Subtotal</div>
              <div style={{ fontSize: '16px' }}>
                Rp {(pesanan.total_harga - pesanan.ongkir).toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Shipping</div>
              <div style={{ fontSize: '16px' }}>
                Rp {pesanan.ongkir.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ paddingTop: '1rem', borderTop: '2px solid #f0f0f0' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.25rem' }}>Total</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
                Rp {pesanan.total_harga.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div style={{
            backgroundColor: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '1.5rem' }}>
              Status Management
            </h2>
            
            {/* Current Status */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.5rem' }}>
                Payment Status
              </div>
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: pesanan.status_pembayaran === 'paid' ? '#d4edda' : '#fff3cd',
                color: pesanan.status_pembayaran === 'paid' ? '#155724' : '#856404',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                {pesanan.status_pembayaran.toUpperCase()}
              </span>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.5rem' }}>
                Order Status
              </div>
              <span style={{
                padding: '0.5rem 1rem',
                backgroundColor: `${getStatusColor(pesanan.status_pesanan)}20`,
                color: getStatusColor(pesanan.status_pesanan),
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'inline-block'
              }}>
                {pesanan.status_pesanan.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Status Update Buttons */}
            {pesanan.status_pembayaran === 'paid' && (
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '0.75rem' }}>
                  Update Status
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pesanan.status_pesanan !== 'processing' && (
                    <button
                      onClick={() => handleStatusUpdate('processing')}
                      disabled={updating}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#0066cc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        opacity: updating ? 0.6 : 1
                      }}
                    >
                      Set as Processing
                    </button>
                  )}
                  {pesanan.status_pesanan !== 'shipped' && (
                    <button
                      onClick={() => handleStatusUpdate('shipped')}
                      disabled={updating}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#0dcaf0',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        opacity: updating ? 0.6 : 1
                      }}
                    >
                      Set as Shipped
                    </button>
                  )}
                  {pesanan.status_pesanan !== 'completed' && (
                    <button
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={updating}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        opacity: updating ? 0.6 : 1
                      }}
                    >
                      Set as Completed
                    </button>
                  )}
                  {pesanan.status_pesanan !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={updating}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: updating ? 'not-allowed' : 'pointer',
                        opacity: updating ? 0.6 : 1
                      }}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Blockchain Info */}
          {pesanan.blockchain_tx_hash && (
            <div style={{
              backgroundColor: '#e8f5e9',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #4caf50'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#2e7d32', marginBottom: '0.5rem' }}>
                Blockchain Verified
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '0.5rem' }}>
                Transaction Hash:
              </div>
              <code style={{
                display: 'block',
                padding: '0.5rem',
                backgroundColor: '#fff',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                marginBottom: '0.5rem'
              }}>
                {pesanan.blockchain_tx_hash}
              </code>
              <a
                href={`https://sepolia.etherscan.io/tx/${pesanan.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0066cc', fontSize: '12px' }}
              >
                View on Etherscan →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;