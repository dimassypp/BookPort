import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import CartContext from '../context/CartContext';
import Footer from '../components/Footer'; 

const DetailPage = () => {
  const { id } = useParams();
  const [buku, setBuku] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const { addItemToCart } = useContext(CartContext);

  useEffect(() => {
    // Fetch detail buku
    axios.get(`http://localhost:5000/api/buku/${id}`)
      .then(res => {
        setBuku(res.data);
      })
      .catch(err => console.error(err));

    // Fetch recommended books (semua buku kecuali yang sedang dilihat)
    axios.get('http://localhost:5000/api/buku')
      .then(res => {
        const filtered = res.data.filter(b => b.id !== parseInt(id)).slice(0, 6);
        setRecommendedBooks(filtered);
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleAddToCart = () => {
    if (buku) {
      addItemToCart(buku, quantity);
      alert(`${buku.judul} (${quantity}x) telah ditambahkan ke keranjang!`);
    }
  };

  if (!buku) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p>Loading...</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '3rem 2rem',
        flex: 1 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4rem', 
          marginBottom: '4rem' 
        }}>
          {/* Product Image */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {buku.gambar_url ? (
              <img 
                src={`http://localhost:5000${buku.gambar_url}`} 
                alt={buku.judul}
                style={{
                  maxWidth: '400px',
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            ) : (
              <div style={{
                width: '400px',
                height: '500px',
                backgroundColor: '#f0f0f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                No Image
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 style={{ 
              fontSize: '36px', 
              fontWeight: '600', 
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              {buku.judul}
            </h1>
            
            <p style={{ 
              fontSize: '18px', 
              color: '#666', 
              marginBottom: '1rem' 
            }}>
              {buku.penulis}
            </p>

            <p style={{ 
              fontSize: '16px', 
              color: '#999', 
              marginBottom: '2rem', 
              lineHeight: '1.6' 
            }}>
              {buku.deskripsi || `Crime and Punishment is a psychological novel by Fyodor Dostoevsky about Rodion Raskolnikov, an impoverished former student in St. Petersburg who murders a pawnbroker and her sister based on a theory that extraordinary people are above moral law.`}
            </p>

            {/* Rating */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{ color: '#ffc107', fontSize: '18px' }}>
                ★★★★★
              </div>
              <span style={{ color: '#666', fontSize: '14px' }}>(5)</span>
            </div>

            {/* Price */}
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              marginBottom: '2rem' 
            }}>
              Rp. {buku.harga.toLocaleString('id-ID')}
            </div>

            {/* Language */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '0.5rem' 
              }}>
                Language
              </p>
              <button style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                {buku.bahasa || 'English'}
              </button>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                marginBottom: '0.5rem' 
              }}>
                Quantity
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem' 
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '20px',
                    // --- FIX: Center content ---
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                    // ---------------------------
                  }}
                >
                  −
                </button>
                <span style={{ 
                  minWidth: '40px', 
                  textAlign: 'center', 
                  fontSize: '18px', 
                  fontWeight: '500' 
                }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '20px',
                    // --- FIX: Center content ---
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                    // ---------------------------
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button 
              onClick={handleAddToCart}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#fff',
                color: '#333',
                border: '2px solid #333',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#333';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#fff';
                e.target.style.color = '#333';
              }}
            >
              Add to cart
            </button>
          </div>
        </div>

        {/* You may also like Section */}
        <div style={{ marginTop: '5rem' }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            marginBottom: '1rem' 
          }}>
            You may also like
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#999', 
            marginBottom: '2rem' 
          }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          {/* Recommended Books Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '2rem'
          }}>
            {recommendedBooks.map((book) => (
              <Link 
                key={book.id} 
                to={`/buku/${book.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
                >
                  <div style={{
                    width: '100%',
                    height: '280px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {book.gambar_url ? (
                      <img 
                        src={`http://localhost:5000${book.gambar_url}`} 
                        alt={book.judul}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#aaa' }}>Image</span>
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '400',
                      lineHeight: '1.4',
                      minHeight: '40px',
                      marginBottom: '0.5rem'
                    }}>
                      {book.judul}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '0.5rem'
                    }}>
                      {book.penulis}
                    </p>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      Rp. {book.harga.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      
    </div>
  );
};

export default DetailPage;