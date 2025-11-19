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
    pendingOrders: 0
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    // Fetch statistics
    const fetchStats = async () => {
      try {
        const booksRes = await axios.get('http://localhost:5000/api/buku');
        const ordersRes = await axios.get('http://localhost:5000/api/admin/pesanan', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const totalRevenue = ordersRes.data
          .filter(o => o.status_pembayaran === 'paid')
          .reduce((sum, o) => sum + o.total_harga, 0);

        const pendingOrders = ordersRes.data
          .filter(o => o.status_pembayaran === 'pending').length;

        setStats({
          totalBooks: booksRes.data.length,
          totalOrders: ordersRes.data.length,
          totalRevenue,
          pendingOrders
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, [user, token, navigate]);

  const StatCard = ({ title, value, color, icon }) => (
    <div style={{
      backgroundColor: '#fff',
      padding: '2rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '0.5rem' }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '2rem' }}>
          Admin Dashboard
        </h1>

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
          />
          <StatCard 
            title="Total Pesanan"
            value={stats.totalOrders}
            color="#28a745"
          />
          <StatCard 
            title="Total Pendapatan"
            value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`}
            color="#ffc107"
          />
          <StatCard 
            title="Pesanan Pending"
            value={stats.pendingOrders}
            color="#dc3545"
          />
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '1.5rem' }}>
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
                cursor: 'pointer'
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
                cursor: 'pointer'
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
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
              >
                Kembali ke Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;