import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import CartContext from "../context/CartContext";
import Footer from "../components/Footer";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItemToCart } = useContext(CartContext);

  useEffect(() => {
    fetchBooks();
  }, [query, category]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.q = query;
      if (category) params.category = category;

      const res = await axios.get("http://localhost:5000/api/buku", { params });
      setBooks(res.data.filter((book) => book.stok > 0)); 
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (book) => {
    addItemToCart(book, 1);
    alert(`${book.judul} ditambahkan ke keranjang!`);
  };

  const getPageTitle = () => {
    if (category) return `Category: ${category}`;
    if (query) return `Search results for "${query}"`;
    return "All Books";
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "18px" }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        {/* Page Title */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "600",
              marginBottom: "0.5rem",
            }}
          >
            {getPageTitle()}
          </h1>
          <p style={{ fontSize: "16px", color: "#666" }}>
            {books.length} {books.length === 1 ? "book" : "books"} found
          </p>
        </div>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📚</div>
            <h2 style={{ fontSize: "24px", marginBottom: "0.5rem" }}>
              No books found
            </h2>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              {category
                ? `No books in category "${category}"`
                : query
                ? `No books match "${query}"`
                : "No books available"}
            </p>
            <Link to="/">
              <button
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor: "#0066cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                Browse All Books
              </button>
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {books.map((book) => (
              <div key={book.id} className="product-card">
                <Link to={`/buku/${book.id}`}>
                  <div className="product-card-image">
                    {book.gambar_url ? (
                      <img
                        src={`http://localhost:5000${book.gambar_url}`}
                        alt={book.judul}
                      />
                    ) : (
                      <div style={{ fontSize: "48px", color: "#aaa" }}>📚</div>
                    )}
                  </div>

                  <div className="product-card-content">
                    {book.kategori && (
                      <div
                        style={{
                          display: "inline-block",
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          marginBottom: "0.5rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {book.kategori}
                      </div>
                    )}

                    <h4 className="product-card-title">{book.judul}</h4>
                    <p className="product-card-author">{book.penulis}</p>
                    <p className="product-card-price">
                      Rp. {book.harga.toLocaleString("id-ID")}
                    </p>

                    {book.stok !== undefined && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: book.stok > 0 ? "#28a745" : "#dc3545",
                          fontWeight: "600",
                          marginTop: "0.5rem",
                        }}
                      >
                        {book.stok > 0 ? `Stock: ${book.stok}` : "Out of Stock"}
                      </p>
                    )}
                  </div>
                </Link>

                <div style={{ padding: "0 1rem 1rem 1rem" }}>
                  <button
                    className="product-card-button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (book.stok > 0) {
                        handleAddToCart(book);
                      }
                    }}
                    disabled={book.stok === 0}
                    style={{
                      backgroundColor: book.stok === 0 ? "#ccc" : "#fff",
                      cursor: book.stok === 0 ? "not-allowed" : "pointer",
                      opacity: book.stok === 0 ? 0.6 : 1,
                    }}
                  >
                    {book.stok === 0 ? "Out of Stock" : "🛒 Add to Cart"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default SearchPage;