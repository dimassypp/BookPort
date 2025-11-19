import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import CartContext from '../context/CartContext';

const CartPage = () => {
  const { cartItems, updateItemQuantity, removeItemFromCart } = useContext(CartContext);

  const total = cartItems.reduce((acc, item) => acc + (item.harga * item.jumlah), 0);

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '32px', color: '#999', marginBottom: '2rem' }}>
          Shopping Cart
        </h2>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '2rem' }}>
          Keranjang Anda kosong
        </p>
        <Link to="/">
          <button style={{
            padding: '1rem 2rem',
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
            Mulai Belanja
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '3rem 2rem',
      minHeight: '80vh'
    }}>
      <h1 style={{ 
        fontSize: '36px', 
        color: '#999',
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        Shopping Cart
      </h1>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #eee',
          fontWeight: '600',
          fontSize: '14px',
          color: '#666'
        }}>
          <div>Product</div>
          <div style={{ textAlign: 'center' }}>Price</div>
          <div style={{ textAlign: 'center' }}>Quantity</div>
          <div style={{ textAlign: 'right' }}>Subtotal</div>
        </div>

        {/* Cart Items */}
        {cartItems.map(item => (
          <div 
            key={item.buku_id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '1rem',
              padding: '2rem 0',
              borderBottom: '1px solid #f0f0f0',
              alignItems: 'center'
            }}
          >
            {/* Product Info */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {item.gambar && (
                <img 
                  src={`http://localhost:5000${item.gambar}`} 
                  alt={item.nama}
                  style={{
                    width: '80px',
                    height: '100px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              )}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {item.nama}
                </h3>
                <p style={{ fontSize: '13px', color: '#999', marginBottom: '0.5rem' }}>
                  English
                </p>
                <button
                  onClick={() => removeItemFromCart(item.buku_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    fontSize: '13px',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Price */}
            <div style={{ textAlign: 'center', fontSize: '16px' }}>
              Rp. {item.harga.toLocaleString('id-ID')}
            </div>

            {/* Quantity Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={() => updateItemQuantity(item.buku_id, Math.max(1, item.jumlah - 1))}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                −
              </button>
              <span style={{ 
                minWidth: '40px', 
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {item.jumlah}
              </span>
              <button
                onClick={() => updateItemQuantity(item.buku_id, item.jumlah + 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
            </div>

            {/* Subtotal */}
            <div style={{ 
              textAlign: 'right', 
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Rp. {(item.harga * item.jumlah).toLocaleString('id-ID')}
            </div>
          </div>
        ))}

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '2rem',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            Total
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            Rp. {total.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Checkout Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <Link to="/checkout">
            <button style={{
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
              Checkout
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;