// frontend/src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Halaman Public
import HomePage from "./pages/HomePage";
import DetailPage from "./pages/DetailPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";

// Halaman User (Protected)
import CheckoutPage from "./pages/CheckoutPage";
import RiwayatPage from "./pages/RiwayatPage";
import DetailRiwayatPage from "./pages/DetailRiwayatPage";
import ProfilePage from "./pages/ProfilePage";

// Halaman Admin (Protected)
import AdminDashboard from "./pages/AdminDashboard";
import AdminBooksPage from "./pages/AdminBooksPage";
import AdminPage from "./pages/AdminPage"; // Tambah Buku
import AdminTransactionsPage from "./pages/AdminTransactionsPage";
import AdminTransactionDetailPage from "./pages/AdminTransactionDetailPage";
import AdminOrderDetailPage from "./pages/AdminOrderDetailPage";

// Komponen
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function AppContent() {
  const location = useLocation();

  // Halaman yang TIDAK menampilkan Navbar
  const hideNavbarPaths = ["/login", "/register"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className="main-content">
        <Routes>
          {/* RUTE PUBLIK */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/buku/:id" element={<DetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* RUTE USER (PROTECTED) */}
          {/* <Route 
            path="/profile" 
            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
          /> */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat"
            element={
              <ProtectedRoute>
                <RiwayatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/riwayat/:id"
            element={
              <ProtectedRoute>
                <DetailRiwayatPage />
              </ProtectedRoute>
            }
          />

          {/* RUTE ADMIN (PROTECTED) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <AdminRoute>
                <AdminBooksPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/add-book"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AdminTransactionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions/:id"
            element={
              <AdminRoute>
                <AdminTransactionDetailPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders/:id"
            element={
              <AdminRoute>
                <AdminOrderDetailPage />
              </AdminRoute>
            }
          />

          {/* 404 NOT FOUND */}
          <Route
            path="*"
            element={
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem",
                  minHeight: "60vh",
                }}
              >
                <h1 style={{ fontSize: "72px", marginBottom: "1rem" }}>404</h1>
                <p style={{ fontSize: "24px", color: "#666" }}>
                  Halaman tidak ditemukan
                </p>
                <a
                  href="/"
                  style={{
                    display: "inline-block",
                    marginTop: "2rem",
                    padding: "1rem 2rem",
                    backgroundColor: "#0066cc",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  Kembali ke Home
                </a>
              </div>
            }
          />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
