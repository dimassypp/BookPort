import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const ProfilePage = () => {
  const { user, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    full_name: '',
    country: 'Indonesia',
    address: '',
    city: '',
    postal_code: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profile = res.data;
      
      // Parse nama jadi first_name dan last_name
      const nameParts = profile.nama ? profile.nama.split(' ') : ['', ''];
      
      setFormData({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: profile.email || '',
        phone: profile.no_hp || '',
        full_name: profile.nama || '',
        country: 'Indonesia',
        address: profile.alamat || '',
        city: '',
        postal_code: ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        'http://localhost:5000/api/profile',
        {
          nama: `${formData.first_name} ${formData.last_name}`.trim(),
          no_hp: formData.phone,
          alamat: formData.address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Profile berhasil diupdate!');

      await fetchProfile();

      window.location.reload();
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Gagal update profile');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh',
      paddingTop: '2rem',
      paddingBottom: '4rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 2rem'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: '400',
          color: '#999',
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          Profile
        </h1>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '200px 1fr',
          gap: '2rem'
        }}>
          {/* Left Sidebar */}
          <div>
            <div 
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '1rem',
                backgroundColor: activeTab === 'profile' ? '#fff' : 'transparent',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: activeTab === 'profile' ? '#0066cc' : '#666',
                fontWeight: activeTab === 'profile' ? '600' : '400'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Profile
            </div>
            <Link to="/riwayat" style={{ textDecoration: 'none' }}>
              <div 
                onClick={() => setActiveTab('transaction')}
                style={{
                  padding: '1rem',
                  backgroundColor: activeTab === 'transaction' ? '#fff' : 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: activeTab === 'transaction' ? '#0066cc' : '#666',
                  fontWeight: activeTab === 'transaction' ? '600' : '400'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                Transaction
              </div>
            </Link>
          </div>

          {/* Right Content */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Account Details */}
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                marginBottom: '2rem'
              }}>
                Account Details
              </h2>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f9f9f9'
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f9f9f9'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="email"
                  name="email"
                  placeholder="JohnDoe@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f0f0f0',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              <div style={{ marginBottom: '3rem' }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="08332926861"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              {/* Address */}
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                marginBottom: '2rem'
              }}>
                Address
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <option>Indonesia</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  name="address"
                  placeholder="Cluster Brooklyn No. 18, Virginia"
                  value={formData.address}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <input
                    type="text"
                    name="city"
                    placeholder="Malang"
                    value={formData.city}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f9f9f9'
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="postal_code"
                    placeholder="135191"
                    value={formData.postal_code}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: '#f9f9f9'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  padding: '1rem 3rem',
                  backgroundColor: '#0066cc',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0052a3'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#0066cc'}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;