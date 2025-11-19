import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import CartContext from "../context/CartContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // State untuk Hover Icons
  const [isCartHovered, setIsCartHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);

  // Fetch categories dari backend
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await axios.get("http://localhost:5000/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowDropdown(false);
  };

  const handleCategoryClick = (category) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
    setShowCategoryDropdown(false);
  };

  const cartItemCount = cart.reduce(
    (total, item) => total + (item.jumlah || item.quantity || 0),
    0
  );

  // --- LOGIKA ICON DINAMIS ---
  const cartIconSrc =
    location.pathname === "/cart" || isCartHovered
      ? "/images/icon_cart_fill.png"
      : "/images/icon_cart.png";

  const profileIconSrc =
    location.pathname === "/profile" || isProfileHovered
      ? "/images/icon_profile_fill.png"
      : "/images/icon_profile.png";

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="nav-logo">
        <img
          src="/images/BookPortLogo.png"
          alt="Bookport Logo"
          style={{ height: "40px" }}
        />
      </Link>

      {/* Category Dropdown */}
      <div
        className="nav-category"
        style={{
          position: "relative",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
        onMouseEnter={() => setShowCategoryDropdown(true)}
        onMouseLeave={() => setShowCategoryDropdown(false)}
      >
        <span>Category</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: showCategoryDropdown ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>

        {/* Category Dropdown Menu */}
        {showCategoryDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              minWidth: "800px",
              padding: "1.5rem",
              zIndex: 1000,
            }}
          >
            {loadingCategories ? (
              <div
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                Loading...
              </div>
            ) : categories.length === 0 ? (
              <div
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "14px",
                }}
              >
                No categories available
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "1rem 2rem",
                }}
              >
                {categories.map((category, index) => (
                  <div
                    key={index}
                    onClick={() => handleCategoryClick(category)}
                    style={{
                      fontSize: "14px",
                      color: "#333",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#0066cc")}
                    onMouseLeave={(e) => (e.target.style.color = "#333")}
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="nav-search">
        <form onSubmit={handleSearch} className="nav-search-wrapper">
          <input
            type="text"
            placeholder="Search by Title, Author, or ISBN"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="nav-search-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
        </form>
      </div>

      {/* Right Side Links */}
      <div className="nav-links">
        <Link
          to="/cart"
          className="nav-link"
          onMouseEnter={() => setIsCartHovered(true)}
          onMouseLeave={() => setIsCartHovered(false)}
        >
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={cartIconSrc}
              alt="Cart"
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
            />

            {cartItemCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  background: "#ff4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                }}
              >
                {cartItemCount}
              </span>
            )}
          </div>
        </Link>

        {user ? (
          <div
            className="nav-link"
            style={{ position: "relative", cursor: "pointer" }}
            onMouseEnter={() => {
              setShowDropdown(true);
              setIsProfileHovered(true);
            }}
            onMouseLeave={() => {
              setShowDropdown(false);
              setIsProfileHovered(false);
            }}
          >
            <img
              src={profileIconSrc}
              alt="Profile"
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
            />
            <span style={{ fontWeight: "600" }}>
              Hello, {user.nama || user.email}
            </span>

            {/* User Dropdown Menu */}
            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #eee",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  minWidth: "200px",
                  zIndex: 1000,
                }}
              >
                {/* Show Admin Dashboard link if user is admin */}
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    style={{
                      display: "block",
                      padding: "0.75rem 1rem",
                      fontSize: "14px",
                      color: "#0066cc",
                      fontWeight: "600",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                    onClick={() => setShowDropdown(false)}
                  >
                    🔧 Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  style={{
                    display: "block",
                    padding: "0.75rem 1rem",
                    fontSize: "14px",
                    color: "#333",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                  onClick={() => setShowDropdown(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/riwayat"
                  style={{
                    display: "block",
                    padding: "0.75rem 1rem",
                    fontSize: "14px",
                    color: "#333",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                  onClick={() => setShowDropdown(false)}
                >
                  Riwayat Pesanan
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    fontSize: "14px",
                    color: "#d32f2f",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    borderRadius: "0 0 8px 8px",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="nav-link"
            onMouseEnter={() => setIsProfileHovered(true)}
            onMouseLeave={() => setIsProfileHovered(false)}
          >
            <img
              src={
                isProfileHovered
                  ? "/images/icon_profile_fill.png"
                  : "/images/icon_profile.png"
              }
              alt="Login"
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
            />
            <span>Login/Sign up</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
