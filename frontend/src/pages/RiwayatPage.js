import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import CartContext from "../context/CartContext";

const RiwayatPage = () => {
  const { token, loading: authLoading } = useContext(AuthContext);
  const { clearCart } = useContext(CartContext);
  const [pesananList, setPesananList] = useState([]);
  // const [pesananDetails, setPesananDetails] = useState({}); // Store details
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (token) {
      fetchRiwayat();
    } else {
      setLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    // Clear cart jika ada pesanan yang sudah paid
    const hasPaidOrder = pesananList.some(
      (p) => p.status_pembayaran === "paid"
    );
    if (hasPaidOrder) {
      clearCart();
    }
  }, [pesananList]);

  // FETCH RIWAYAT LAMA
  // const fetchRiwayat = async () => {
  //   try {
  //     const res = await axios.get('http://localhost:5000/api/pesanan', {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     setPesananList(res.data);

  //     // Fetch details for each order
  //     res.data.forEach(async (pesanan) => {
  //       try {
  //         const detailRes = await axios.get(`http://localhost:5000/api/pesanan/${pesanan.id}`, {
  //           headers: { Authorization: `Bearer ${token}` }
  //         });
  //         setPesananDetails(prev => ({
  //           ...prev,
  //           [pesanan.id]: detailRes.data.detail
  //         }));
  //       } catch (err) {
  //         console.error(`Error fetching detail for order ${pesanan.id}:`, err);
  //       }
  //     });
  //   } catch (err) {
  //     console.error('Error fetching orders:', err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchRiwayat = async () => {
    setLoading(true); 
    try {
      const res = await axios.get("http://localhost:5000/api/pesanan", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPesananList(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusPembayaran, statusPesanan) => {
    if (statusPembayaran === "pending") {
      return { text: "Unpaid", color: "#ffc107", bgColor: "#fff3cd" };
    }
    if (statusPembayaran === "paid") {
      if (statusPesanan === "processing") {
        return { text: "On Process", color: "#0066cc", bgColor: "#cfe2ff" };
      }
      if (statusPesanan === "shipped") {
        return { text: "Delivering", color: "#0dcaf0", bgColor: "#cff4fc" };
      }
      if (statusPesanan === "completed") {
        return { text: "Done", color: "#28a745", bgColor: "#d4edda" };
      }
    }
    if (statusPembayaran === "failed" || statusPesanan === "cancelled") {
      return { text: "Cancelled", color: "#dc3545", bgColor: "#f8d7da" };
    }
    return { text: statusPesanan, color: "#6c757d", bgColor: "#e9ecef" };
  };

  const filteredOrders = pesananList.filter((p) => {
    if (filter === "all") return true;
    if (filter === "unpaid") return p.status_pembayaran === "pending";
    if (filter === "processing")
      return (
        p.status_pembayaran === "paid" && p.status_pesanan === "processing"
      );
    if (filter === "completed") return p.status_pesanan === "completed";
    if (filter === "cancelled")
      return (
        p.status_pembayaran === "failed" || p.status_pesanan === "cancelled"
      );
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        paddingTop: "2rem",
        paddingBottom: "4rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "400",
            color: "#999",
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          Profile
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: "2rem",
          }}
        >
          {/* Left Sidebar */}
          <div>
            <Link to="/profile" style={{ textDecoration: "none" }}>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "transparent",
                  borderRadius: "8px",
                  marginBottom: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#666",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </div>
            </Link>
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#fff",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "#0066cc",
                fontWeight: "600",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Transaction
            </div>
          </div>

          {/* Right Content */}
          <div>
            {/* Filter Tabs */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "2rem",
                backgroundColor: "#fff",
                padding: "0.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {[
                { key: "all", label: "All" },
                { key: "unpaid", label: "Unpaid" },
                { key: "processing", label: "Processing" },
                { key: "completed", label: "Completed" },
                { key: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor:
                      filter === tab.key ? "#0066cc" : "transparent",
                    color: filter === tab.key ? "#fff" : "#666",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "3rem",
                  borderRadius: "12px",
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Tidak ada pesanan
              </div>
            ) : (
              filteredOrders.map((pesanan) => (
                <div
                  key={pesanan.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    marginBottom: "1rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                      paddingBottom: "1rem",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Order ID #{pesanan.id}
                      </div>
                      <div style={{ fontSize: "13px", color: "#999" }}>
                        Arrived:{" "}
                        {new Date(pesanan.created_at).toLocaleDateString(
                          "en-US",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const badge = getStatusBadge(
                          pesanan.status_pembayaran,
                          pesanan.status_pesanan
                        );
                        return (
                          <span
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: badge.bgColor,
                              color: badge.color,
                              borderRadius: "20px",
                              fontSize: "13px",
                              fontWeight: "600",
                            }}
                          >
                            ● {badge.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Order Items Preview (first 2 items) */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      {/* Tampilkan gambar dari data baru */}
                      {pesanan.item_gambar ? (
                        <img
                          src={`http://localhost:5000${pesanan.item_gambar}`}
                          alt={pesanan.item_judul}
                          style={{
                            width: "60px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "60px",
                            height: "80px",
                            backgroundColor: "#f0f0f0",
                            borderRadius: "4px",
                          }}
                        />
                      )}

                      {/* Tampilkan info dari data baru */}
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {pesanan.item_judul}
                        </div>
                        <div style={{ fontSize: "13px", color: "#666" }}>
                          {/* Tampilkan jika ada lebih dari 1 item */}
                          {pesanan.total_item > 1 && (
                            <span>
                              (+ {pesanan.total_item - 1} item lainnya)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "1rem",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: "600" }}>
                      Total: Rp. {pesanan.total_harga.toLocaleString("id-ID")}
                    </div>
                    <Link to={`/riwayat/${pesanan.id}`}>
                      <button
                        style={{
                          padding: "0.5rem 1.5rem",
                          backgroundColor: "#1a1a1a",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          cursor: "pointer",
                        }}
                      >
                        Details
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiwayatPage;
