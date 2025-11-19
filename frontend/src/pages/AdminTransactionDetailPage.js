import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const AdminTransactionDetailPage = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Tambahkan token sebagai dependency
    if (token) {
      fetchOrderDetail();
    }
  }, [id, token]);

  const fetchOrderDetail = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/admin/pesanan/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrder(res.data);
    } catch (err) {
      console.error("Error fetching order detail:", err);
      alert("Gagal memuat detail pesanan");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin mengubah status menjadi "${newStatus}"?`
      )
    ) {
      return;
    }

    setUpdating(true);
    try {
      await axios.put(
        `http://localhost:5000/api/admin/pesanan/${id}/status`,
        { status_pesanan: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Status berhasil diupdate!");
      fetchOrderDetail(); // Refresh data
    } catch (err) {
      console.error("Error updating status:", err);
      alert(
        "Gagal mengupdate status: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      "waiting payment": { bg: "#fff3cd", color: "#856404" },
      processing: { bg: "#cfe2ff", color: "#084298" },
      shipped: { bg: "#d1e7dd", color: "#0f5132" },
      completed: { bg: "#d4edda", color: "#155724" },
      cancelled: { bg: "#f8d7da", color: "#721c24" },
    };
    return colors[status] || colors["waiting payment"];
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: { bg: "#d4edda", color: "#155724" },
      pending: { bg: "#fff3cd", color: "#856404" },
      failed: { bg: "#f8d7da", color: "#721c24" },
    };
    return colors[status] || colors["pending"];
  };

  const canUpdateTo = (currentStatus, targetStatus) => {
    const flow = {
      "waiting payment": ["cancelled"], // Waiting payment hanya bisa cancel (processing otomatis dari webhook)
      processing: ["shipped", "cancelled"], // Admin bisa kirim barang atau cancel
      shipped: ["completed", "cancelled"], // Barang sampai atau cancel
      completed: [], // Final state
      cancelled: [], // Final state
    };
    return flow[currentStatus]?.includes(targetStatus) || false;
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "18px" }}>Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "18px", color: "#dc3545" }}>
          Pesanan tidak ditemukan
        </div>
        <Link to="/admin/transactions">
          <button style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
            ← Kembali
          </button>
        </Link>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status_pesanan);
  const paymentColor = getPaymentStatusColor(order.status_pembayaran);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "0.5rem" }}>
            Detail Pesanan #{order.id}
          </h1>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Dibuat: {new Date(order.created_at).toLocaleString("id-ID")}
          </div>
        </div>
        <Link to="/admin/transactions">
          <button
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Kembali
          </button>
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "1.5rem",
        }}
      >
        {/* Left Column */}
        <div>
          {/* Customer Info */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "1rem" }}>
              Informasi Customer
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Nama</div>
                <div style={{ fontWeight: "500" }}>{order.user_nama}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Email</div>
                <div>{order.user_email}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Alamat Pengiriman
                </div>
                <div>{order.alamat_pengiriman || "-"}</div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "1rem" }}>
              Item Pesanan
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {order.items &&
                order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      padding: "1rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      alignItems: "center",
                    }}
                  >
                    {item.cover_image ? (
                      <img
                        src={`http://localhost:5000${item.cover_image}`}
                        alt={item.judul}
                        style={{
                          width: "80px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      // Placeholder jika tidak ada gambar
                      <div
                        style={{
                          width: "80px",
                          height: "120px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{ fontWeight: "600", marginBottom: "0.25rem" }}
                      >
                        {item.judul}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          marginBottom: "0.5rem",
                        }}
                      >
                        oleh {item.penulis}
                      </div>
                      <div style={{ fontSize: "14px" }}>
                        <span style={{ color: "#666" }}>Jumlah:</span>{" "}
                        {item.jumlah} ×
                        <span style={{ fontWeight: "500" }}>
                          {" "}
                          Rp {item.harga.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontWeight: "600", fontSize: "16px" }}>
                      Rp {(item.jumlah * item.harga).toLocaleString("id-ID")}
                    </div>
                  </div>
                ))}
            </div>

            {/* Total */}
            <div
              style={{
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "2px solid #dee2e6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "18px", fontWeight: "600" }}>Total</div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#28a745",
                }}
              >
                Rp {order.total_harga.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Blockchain Info */}
          {order.blockchain_tx_hash && (
            <div
              style={{
                backgroundColor: "#fff",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ fontSize: "18px", marginBottom: "1rem" }}>
                Blockchain Transaction
              </h3>
              <div
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Transaction Hash:
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  backgroundColor: "#f8f9fa",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  wordBreak: "break-all",
                  marginBottom: "1rem",
                }}
              >
                {order.blockchain_tx_hash}
              </div>
              <a
                href={`https://sepolia.etherscan.io/tx/${order.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#0066cc",
                  color: "#fff",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                View on Etherscan →
              </a>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Status Card */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "1rem" }}>Status</h3>

            {/* Payment Status */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Status Pembayaran
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  backgroundColor: paymentColor.bg,
                  color: paymentColor.color,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {order.status_pembayaran}
              </span>
            </div>

            {/* Order Status */}
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Status Pesanan
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  backgroundColor: statusColor.bg,
                  color: statusColor.color,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {order.status_pesanan}
              </span>
            </div>
          </div>

          {/* Status Actions */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "1rem" }}>
              Update Status
            </h3>

            {order.status_pesanan === "completed" ||
            order.status_pesanan === "cancelled" ? (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "6px",
                  textAlign: "center",
                  color: "#666",
                }}
              >
                Pesanan sudah{" "}
                {order.status_pesanan === "completed"
                  ? "selesai"
                  : "dibatalkan"}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {/* Show current status indicator */}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    backgroundColor: "#e9ecef",
                    color: "#495057",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    textAlign: "center",
                    textTransform: "capitalize",
                  }}
                >
                  ✓ Current: {order.status_pesanan}
                </div>

                {/* Show available action buttons */}
                {order.status_pesanan === "processing" && (
                  <>
                    <button
                      onClick={() => updateStatus("shipped")}
                      disabled={updating}
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#0d6efd",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: updating ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "Updating..." : "📦 Set as Shipped"}
                    </button>
                    <button
                      onClick={() => updateStatus("cancelled")}
                      disabled={updating}
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: updating ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "Updating..." : "✖ Cancel Order"}
                    </button>
                  </>
                )}

                {order.status_pesanan === "shipped" && (
                  <>
                    <button
                      onClick={() => updateStatus("completed")}
                      disabled={updating}
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: updating ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "Updating..." : "✓ Set as Completed"}
                    </button>
                    <button
                      onClick={() => updateStatus("cancelled")}
                      disabled={updating}
                      style={{
                        padding: "0.75rem 1rem",
                        backgroundColor: "#dc3545",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: updating ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: updating ? 0.6 : 1,
                      }}
                    >
                      {updating ? "Updating..." : "✖ Cancel Order"}
                    </button>
                  </>
                )}

                {order.status_pesanan === "waiting payment" && (
                  <button
                    onClick={() => updateStatus("cancelled")}
                    disabled={updating}
                    style={{
                      padding: "0.75rem 1rem",
                      backgroundColor: "#dc3545",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: updating ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      opacity: updating ? 0.6 : 1,
                    }}
                  >
                    {updating ? "Updating..." : "✖ Cancel Order"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginTop: "1.5rem",
            }}
          >
            <h3 style={{ fontSize: "18px", marginBottom: "1rem" }}>Timeline</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#0066cc",
                    marginTop: "6px",
                  }}
                ></div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500" }}>
                    Pesanan dibuat
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {new Date(order.created_at).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {order.updated_at && order.updated_at !== order.created_at && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#28a745",
                      marginTop: "6px",
                    }}
                  ></div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500" }}>
                      Status terakhir diupdate
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(order.updated_at).toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactionDetailPage;
