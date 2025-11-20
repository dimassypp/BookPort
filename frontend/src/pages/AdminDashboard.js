import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Fetch statistics
    const fetchStats = async () => {
      try {
        setLoading(true);

        const [booksRes, ordersRes, revenueRes] = await Promise.all([
          axios.get('http://localhost:5000/api/buku'),
          axios.get('http://localhost:5000/api/admin/pesanan', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/admin/revenue', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Hitung pending orders (exclude cancelled)
        const pendingOrders = ordersRes.data
          .filter(o => o.status_pembayaran === 'pending' && o.status_pesanan !== 'cancelled')
          .length;

        // Total orders aktif (exclude cancelled)
        const activeOrders = ordersRes.data
          .filter(o => o.status_pesanan !== 'cancelled')
          .length;

        setStats({
          totalBooks: booksRes.data.length,
          totalOrders: activeOrders,
          totalRevenue: revenueRes.data.total_revenue,
          completedOrders: revenueRes.data.completed_orders,
          pendingOrders
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, token, navigate]);

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
        {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
        {title}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#999', marginTop: '0.5rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
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
          <p style={{ color: '#666' }}>Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '0.5rem', color: '#333' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Selamat datang, {user?.nama || 'Admin'}! Kelola toko buku Anda di sini.
          </p>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <StatCard 
            title="Total Buku"
            value={stats.totalBooks}
            color="#0066cc"
            subtitle="Jumlah buku dalam katalog"
          />
          <StatCard 
            title="Pesanan Aktif"
            value={stats.totalOrders}
            color="#28a745"
            subtitle="Pesanan yang belum dibatalkan"
          />
          <StatCard 
            title="Total Pendapatan"
            value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
            color="#ffc107"
            subtitle={`Dari ${stats.completedOrders} pesanan selesai`}
          />
          <StatCard 
            title="Pesanan Pending"
            value={stats.pendingOrders}
            color="#dc3545"
            subtitle="Menunggu pembayaran"
          />
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '1.5rem', color: '#333' }}>
            Quick Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <Link to="/admin/books" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0052a3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#0066cc'}
              >
                Kelola Buku
              </button>
            </Link>

            <Link to="/admin/add-book" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                Tambah Buku Baru
              </button>
            </Link>

            <Link to="/admin/transactions" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#e0a800'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
              >
                Lihat Transaksi
              </button>
            </Link>

            <Link to="/" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Kembali ke Home
              </button>
            </Link>
          </div>
        </div>

        {/* Info Banner */}
        <div style={{
          marginTop: '2rem',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '24px' }}>ℹ️</span>
          <div>
            <strong style={{ color: '#0066cc' }}>Info:</strong>
            <span style={{ color: '#555', marginLeft: '0.5rem' }}>
              Total Pendapatan hanya menghitung pesanan yang sudah dibayar dan tidak dibatalkan.
            </span>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;