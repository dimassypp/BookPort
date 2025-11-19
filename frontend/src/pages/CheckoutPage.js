import React, { useState, useContext, useEffect } from 'react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);

  const [formData, setFormData] = useState({
    phone_number: user?.no_hp || '',
    country: 'Indonesia',
    first_name: user?.nama?.split(' ')[0] || '',
    last_name: user?.nama?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    address: user?.alamat || '',
    city: '',
    postal_code: ''
  });

  // Load Midtrans Snap Script
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY; 

    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    
    if (!formData.phone_number || !formData.first_name || !formData.email || 
        !formData.address || !formData.city || !formData.postal_code) {
      alert('Mohon lengkapi semua field!');
      return;
    }

    setLoading(true);

    try {
      const checkoutData = {
        alamat_pengiriman: formData,
        cart_items: cartItems.map(item => ({ 
          buku_id: item.buku_id, 
          jumlah: item.jumlah 
        })),
        ongkir: 10000 // ongkir statis
      };

      console.log('Sending checkout request:', checkoutData);

      const res = await axios.post(
        'http://localhost:5000/api/checkout', 
        checkoutData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const { snapToken } = res.data;
      console.log('Received Snap Token:', snapToken);

      // Tampilkan Midtrans Pop-up
      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: (result) => {
            console.log('Payment Success:', result);
            alert("Pembayaran Berhasil! Pesanan Anda sedang diproses.");
            clearCart();
            navigate('/riwayat');
          },
          onPending: (result) => {
            console.log('Payment Pending:', result);
            alert("Pembayaran Anda sedang diproses. Silakan selesaikan pembayaran.");
            // Arahkan ke riwayat untuk melihat order yang pending
            navigate('/riwayat');
          },
          onError: (result) => {
            console.error('Payment Error:', result);
            alert("Pembayaran Gagal. Silakan coba lagi.");
            setLoading(false);
          },
          onClose: () => {
            console.log('Payment popup closed by user');
            // Arahkan ke halaman riwayat saat popup ditutup
            alert("Anda menutup pop-up pembayaran. Pesanan Anda tersimpan di Riwayat.");
            setLoading(false);
            navigate('/riwayat'); // Arahkan ke riwayat
          }
        });
      } else {
        console.error("Midtrans Snap.js script not loaded yet.");
        alert("Gagal memuat Snap. Silakan refresh halaman.");
        setLoading(false);
      }

    } catch (err) {
      console.error('Checkout error:', err);
      alert(`Checkout Gagal: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.harga * item.jumlah), 0);
  const shipping = 10000;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem',
        minHeight: '60vh'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '1rem' }}>
          Keranjang Anda kosong
        </h2>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Kembali Belanja
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '2rem',
      minHeight: '80vh'
    }}>
      <h1 style={{ 
        fontSize: '36px', 
        fontWeight: '400',
        color: '#999',
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        Checkout
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px',
        gap: '3rem'
      }}>
        {/* Left Side - Order Summary */}
        <div>
          {cartItems.map((item) => (
            <div 
              key={item.buku_id}
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                {item.gambar ? (
                  <img 
                    src={`http://localhost:5000${item.gambar}`}
                    alt={item.nama}
                    style={{
                      width: '80px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      border: '1px solid #eee'
                    }}
                  />
                ) : (
                  <div style={{width: '80px', height: '100px', backgroundColor: '#f0f0f0', borderRadius: '8px'}} />
                )}
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#0066cc',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {item.jumlah}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', marginBottom: '0.25rem' }}>
                  {item.nama}
                </h4>
                <p style={{ fontSize: '13px', color: '#999' }}>English</p>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '500' }}>
                Rp. {item.harga.toLocaleString('id-ID')}
              </div>
            </div>
          ))}

          <div style={{ 
            borderTop: '1px solid #eee',
            paddingTop: '1rem',
            marginTop: '2rem'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              fontSize: '14px'
            }}>
              <span>Subtotal</span>
              <span>Rp. {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '1rem',
              fontSize: '14px'
            }}>
              <span>Shipping</span>
              <span>Rp. {shipping.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid #eee',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <span>Total</span>
              <span>Rp. {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div>
          <form onSubmit={handlePayNow}>
            {/* Contact */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Contact</h3>
                {!user && (
                  <a href="/login" style={{ fontSize: '13px', color: '#0066cc' }}>
                    Have an account? Login
                  </a>
                )}
              </div>
              <input 
                type="tel"
                name="phone_number"
                placeholder="Phone Number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Delivery */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Delivery
              </h3>
              
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '1rem'
                }}
              >
                <option>Indonesia</option>
              </select>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <input 
                  type="text"
                  name="first_name"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.9rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <input 
                  type="text"
                  name="last_name"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  style={{
                    padding: '0.9rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <input 
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '1rem'
                }}
              />

              <input 
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '1rem'
                }}
              />

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <input 
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.9rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <input 
                  type="text"
                  name="postal_code"
                  placeholder="Postal Code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.9rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox"
                  checked={saveInfo}
                  onChange={(e) => setSaveInfo(e.target.checked)}
                />
                Save This Info for future
              </label>
            </div>

            {/* Payment */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Payment
              </h3>
              
              <div style={{
                padding: '1rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9f9f9'
              }}>
                <span style={{ fontSize: '14px' }}>QRIS / Credit Card / Bank Transfer</span>
                <span style={{ fontSize: '20px' }}>💳</span>
              </div>
            </div>

            {/* Pay Button */}
            <button 
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? '#ccc' : '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#000')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#1a1a1a')}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;