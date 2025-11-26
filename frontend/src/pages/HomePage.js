import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import api from '../api';
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import CartContext from "../context/CartContext";

const HomePage = () => {
  const [bukuList, setBukuList] = useState([]);
  const [filteredBukuList, setFilteredBukuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const { addItemToCart } = useContext(CartContext);

  // Fetch books
  useEffect(() => {
    const fetchBuku = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/buku");
        // Filter buku yang stoknya > 0 hanya di HomePage
        const bukuTersedia = response.data.filter((buku) => buku.stok > 0);
        setBukuList(bukuTersedia);
        setFilteredBukuList(bukuTersedia);
      } catch (err) {
        setError("Gagal mengambil data buku");
      } finally {
        setLoading(false);
      }
    };
    fetchBuku();
  }, []);


  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/api/categories');
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Filter books when category changes
  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredBukuList(bukuList);
    } else {
      const filtered = bukuList.filter(
        (buku) => buku.kategori === activeCategory
      );
      setFilteredBukuList(filtered);
    }
  }, [activeCategory, bukuList]);

  // Get category display info
  const getCategoryInfo = () => {
    if (activeCategory === "all") {
      return {
        title: "All Books",
        subtitle:
          "Explore our complete catalog ranging from timeless classics to modern bestsellers across all genres.",
      };
    }

    // Custom info per category
    const categoryInfoMap = {
      Fiction: {
        title: "Fiction Books",
        subtitle:
          "Discover captivating stories and imaginative worlds from talented authors around the globe",
      },
      Biography: {
        title: "Biography Books",
        subtitle:
          "Learn from the lives of extraordinary people who changed the world",
      },
      History: {
        title: "History Books",
        subtitle:
          "Explore the past and understand how it shapes our present and future",
      },
      Science: {
        title: "Science Books",
        subtitle:
          "Dive into the wonders of scientific discovery and innovation",
      },
      Technology: {
        title: "Technology Books",
        subtitle:
          "Stay ahead with the latest insights in tech and digital transformation",
      },
    };

    // Return custom info or default
    return (
      categoryInfoMap[activeCategory] || {
        title: `${activeCategory} Books`,
        subtitle: `Explore our curated collection of ${activeCategory.toLowerCase()} books`,
      }
    );
  };

  const categoryInfo = getCategoryInfo();
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  if (loading) return <p className="container">Loading...</p>;
  if (error)
    return (
      <p className="container" style={{ color: "red" }}>
        {error}
      </p>
    );

  return (
    <>
      {/* Category Section */}
      <div className="category-section">
        <h2 className="category-title">{categoryInfo.title}</h2>
        <p className="category-subtitle">{categoryInfo.subtitle}</p>

        <div className="category-tabs">
          {/* All Books Tab */}
          <button
            className={`category-tab ${
              activeCategory === "all" ? "active" : ""
            }`}
            onClick={() => handleCategoryClick("all")}
          >
            All Books
          </button>

          {/* Dynamic Category Tabs */}
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${
                activeCategory === cat ? "active" : ""
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p
          style={{
            textAlign: "center",
            marginTop: "1rem",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Showing {filteredBukuList.length}{" "}
          {filteredBukuList.length === 1 ? "book" : "books"}
          {activeCategory !== "all" && ` in ${activeCategory}`}
        </p>
      </div>

      {/* Product Grid */}
      <div className="container">
        {filteredBukuList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "12px",
              margin: "2rem auto",
              maxWidth: "600px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📚</div>
            <h3 style={{ fontSize: "24px", marginBottom: "0.5rem" }}>
              No books found
            </h3>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              No books available in "{activeCategory}" category
            </p>
            <button
              onClick={() => handleCategoryClick("all")}
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
              View All Books
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredBukuList.map((buku) => (
              <div key={buku.id} className="product-card">
                <Link to={`/buku/${buku.id}`}>
                  <div className="product-card-image">
                    {buku.gambar_url ? (
                      <img
                        src={`http://localhost:5000${buku.gambar_url}`}
                        alt={buku.judul}
                      />
                    ) : (
                      "Image"
                    )}
                  </div>
                  <div className="product-card-content">
                    {/* Category Badge */}
                    {buku.kategori && (
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
                        {buku.kategori}
                      </div>
                    )}

                    <h4 className="product-card-title">{buku.judul}</h4>
                    <p className="product-card-author">{buku.penulis}</p>
                    <p className="product-card-price">
                      Rp. {buku.harga.toLocaleString("id-ID")}
                    </p>

                    {/* Stock Info */}
                    {buku.stok !== undefined && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: buku.stok > 0 ? "#28a745" : "#dc3545",
                          fontWeight: "600",
                          marginTop: "0.5rem",
                        }}
                      >
                        {buku.stok > 0 ? `Stock: ${buku.stok}` : "Out of Stock"}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default HomePage;
