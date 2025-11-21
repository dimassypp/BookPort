import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const DetailRiwayatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (token) {
      fetchDetail();
    } else {
      setLoading(false);
    }
    // Logika untuk memuat script Midtrans
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.REACT_APP_MIDTRANS_CLIENT_KEY;

    const script = document.createElement("script");
    script.src = snapScript;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;

    if (!document.querySelector(`script[src="${snapScript}"]`)) {
      document.head.appendChild(script);
    }
  }, [id, token, authLoading]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/pesanan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!data || !data.pesanan) return;

    setPaymentLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/retry-payment",
        { order_id: data.pesanan.midtrans_order_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { snapToken } = res.data;

      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          console.log("Payment Success:", result);
          alert("Pembayaran Berhasil!");
          fetchDetail();
        },
        onPending: (result) => {
          console.log("Payment Pending:", result);
          alert("Pembayaran sedang diproses.");
          fetchDetail();
        },
        onError: (result) => {
          console.error("Payment Error:", result);
          alert("Pembayaran Gagal.");
        },
        onClose: () => {
          console.log("Payment popup closed");
        },
      });
    } catch (err) {
      console.error("Error retrying payment:", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusInfoSimple = (pesanan) => {
    const createdDate = new Date(pesanan.created_at);
    const updatedDate = new Date(pesanan.updated_at);
    const status = pesanan.status_pesanan;
    const paymentStatus = pesanan.status_pembayaran;

    const steps = [
      {
        key: "waiting payment",
        label: "Purchased",
        icon: "/images/purchased_icon.png",
        date: createdDate, // Always show created date
        active: true,
      },
      {
        key: "processing",
        label: "Processing",
        icon: "/images/processing_icon.png",
        date:
          paymentStatus === "paid" &&
          ["processing", "shipped", "completed"].includes(status)
            ? updatedDate
            : null,
        active:
          paymentStatus === "paid" &&
          ["processing", "shipped", "completed"].includes(status),
      },
      {
        key: "shipped",
        label: "Delivering",
        icon: "/images/delivering_icon.png",
        date: ["shipped", "completed"].includes(status) ? updatedDate : null,
        active: ["shipped", "completed"].includes(status),
      },
      {
        key: "completed",
        label: "Completed",
        icon: "/images/completed_icon.png",
        date: status === "completed" ? updatedDate : null,
        active: status === "completed",
      },
    ];

    return steps;
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        Order not found
      </div>
    );
  }

  const { pesanan, detail } = data;
  const statusSteps = getStatusInfoSimple(pesanan);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        overflowY: "auto",
        padding: "2rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          maxWidth: "1000px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "2rem",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            backgroundColor: "#fff",
            zIndex: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "0.25rem",
              }}
            >
              Order {pesanan.order_number || `#${pesanan.id}`}
            </h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Arrived: {formatDate(pesanan.created_at)}
            </p>
          </div>
          <button
            onClick={() => navigate("/riwayat")}
            style={{
              background: "none",
              border: "none",
              fontSize: "32px",
              cursor: "pointer",
              color: "#666",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Status Timeline */}
        <div style={{ padding: "2rem", borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {/* Progress Line */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "10%",
                right: "10%",
                height: "2px",
                backgroundColor: "#e0e0e0",
                zIndex: 0,
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#0066cc",
                  width: `${
                    (statusSteps.filter((s) => s.active).length - 1) * 33.33
                  }%`,
                  transition: "width 0.3s",
                }}
              />
            </div>

            {statusSteps.map((step, index) => (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  flex: 1,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: step.active ? "#0066cc" : "#e0e0e0",
                    color: step.active ? "#fff" : "#999",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    transition: "all 0.3s",
                  }}
                >
                  <img
                    src={step.icon}
                    alt={step.label}
                    style={{
                      width: "40%",
                      height: "40%",
                      objectFit: "contain",
                      filter: step.active
                        ? "brightness(0) invert(1)"
                        : "grayscale(100%) opacity(0.5)",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: step.active ? "600" : "400",
                    color: step.active ? "#0066cc" : "#999",
                    textAlign: "center",
                  }}
                >
                  {step.label}
                </div>
                {step.date && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      textAlign: "center",
                    }}
                  >
                    {formatDate(step.date)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order Items */}
        <div style={{ padding: "2rem" }}>
          {detail.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
                borderBottom:
                  index < detail.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div style={{ position: "relative" }}>
                {item.gambar_url ? (
                  <img
                    src={`http://localhost:5000${item.gambar_url}`}
                    alt={item.judul}
                    style={{
                      width: "80px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "80px",
                      height: "100px",
                      backgroundColor: "#f0f0f0",
                      borderRadius: "8px",
                    }}
                  />
                )}
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    backgroundColor: "#0066cc",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {item.jumlah}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.judul}
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  English
                </p>
                <p style={{ fontSize: "14px", fontWeight: "500" }}>
                  {item.jumlah} Items
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <button
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f0f0f0",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Main Address
                </button>
              </div>
            </div>
          ))}

{/* Total */}
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "2px solid #f0f0f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "1rem",
              }}
            >
              <span>
                Total: Rp. {pesanan.total_harga.toLocaleString("id-ID")} (
                {detail.reduce((sum, item) => sum + item.jumlah, 0)} items)
              </span>
            </div>

            {/* Pay Now Button */}
            {pesanan.status_pembayaran === "pending" && (
              <button
                onClick={handlePayNow}
                disabled={paymentLoading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: paymentLoading ? "#ccc" : "#ffc107",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: paymentLoading ? "not-allowed" : "pointer",
                  marginTop: "1rem",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  !paymentLoading &&
                  (e.target.style.backgroundColor = "#e0a800")
                }
                onMouseOut={(e) =>
                  !paymentLoading &&
                  (e.target.style.backgroundColor = "#ffc107")
                }
              >
                {paymentLoading ? "Processing..." : "Pay Now"}
              </button>
            )}
          </div>

          {/* Payment Method Card */}
          {pesanan.payment_method && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1rem 1.5rem",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#fff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>
                    Paid via
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "600" }}>
                    {pesanan.payment_method}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rating Section */}
          {pesanan.status_pesanan === "completed" && (
            <div
              style={{
                marginTop: "2rem",
                padding: "2rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "1.5rem",
                }}
              >
                Rate your experience
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "48px",
                      cursor: "pointer",
                      color: star <= rating ? "#ffc107" : "#ddd",
                      transition: "color 0.2s",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "1.5rem",
                }}
              >
                Need assistance?{" "}
                <a href="/support" style={{ color: "#0066cc" }}>
                  Support Center
                </a>
              </p>
            </div>
          )}

          {/* Blockchain Proof */}
          {pesanan.blockchain_tx_hash && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1.5rem",
                backgroundColor: "#e8f5e9",
                borderRadius: "8px",
                border: "1px solid #4caf50",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#2e7d32",
                  }}
                >
                  Blockchain Verified
                </h4>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Transaction Hash:
              </p>
              <code
                style={{
                  display: "block",
                  padding: "0.5rem",
                  backgroundColor: "#fff",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  marginBottom: "0.75rem",
                }}
              >
                {pesanan.blockchain_tx_hash}
              </code>
              
                <a href={`https://sepolia.etherscan.io/tx/${pesanan.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#0066cc",
                  fontSize: "13px",
                  textDecoration: "underline",
                }}
              >
                View on Etherscan
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailRiwayatPage;