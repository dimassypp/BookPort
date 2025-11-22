import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import io from "socket.io-client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom Driver Icon
const driverIcon = L.divIcon({
  className: "custom-driver-icon",
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Custom Destination Icon
const destinationIcon = L.divIcon({
  className: "custom-destination-icon",
  html: `
    <div style="position: relative; width: 35px; height: 50px;">
      <svg width="35" height="50" viewBox="0 0 24 36" fill="#ef4444">
        <path d="M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0Z"/>
        <circle cx="12" cy="8.5" r="3" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [35, 50],
  iconAnchor: [17.5, 50],
});

// Auto-center map component
function AutoCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom(), {
        animate: true,
        duration: 1,
      });
    }
  }, [position, map]);

  return null;
}

// Live Tracking Component
const LiveTracking = ({ orderId, orderStatus }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [driverPosition, setDriverPosition] = useState(null);
  const [isDelivered, setIsDelivered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const { token } = useContext(AuthContext);

  // DEBUG LOGS
  console.log("LiveTracking Component Rendered:", {
    orderId,
    orderStatus,
    isLoading,
    hasTrackingData: !!trackingData,
    hasDriverPosition: !!driverPosition,
    token: token ? "exists" : "missing",
  });

  useEffect(() => {
    console.log("useEffect triggered:", { orderStatus });

    if (orderStatus !== "shipped") {
      console.log("Status bukan shipped:", orderStatus);
      setIsLoading(false);
      return;
    }

    console.log("Status = shipped, fetching data...");
    fetchTrackingData();

    const socket = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000",
      {
        transports: ["websocket", "polling"],
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.emit("track_order", orderId);
    console.log("Emitted track_order:", orderId);

    socket.on("driver_position", (position) => {
      console.log("Driver position updated:", position);
      setDriverPosition(position);
    });

    socket.on("delivery_completed", (data) => {
      console.log("Delivery completed:", data);
      setIsDelivered(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    });

    socket.on("tracking_ended", (data) => {
      console.log("Tracking ended:", data);
      socket.disconnect();
    });

    return () => {
      if (socketRef.current) {
        console.log("Disconnecting socket...");
        socketRef.current.disconnect();
      }
    };
  }, [orderId, orderStatus, token]);

  const fetchTrackingData = async () => {
    console.log("Fetching tracking from API...");
    console.log(
      "URL:",
      `http://localhost:5000/api/pesanan/${orderId}/tracking`
    );
    console.log("Token:", token ? "exists" : "MISSING!");

    try {
      const response = await axios.get(
        `http://localhost:5000/api/pesanan/${orderId}/tracking`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("API Response:", response.data);

      if (response.data.tracking_available) {
        console.log("Setting tracking data...");
        setTrackingData(response.data);
        setDriverPosition(response.data.driver);
        console.log("Tracking data set successfully!");
      } else {
        console.log("Tracking not available, response:", response.data);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch tracking:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setIsLoading(false);
    }
  };

  const calculateDistance = () => {
    if (!driverPosition || !trackingData?.destination) return null;

    const R = 6371;
    const dLat =
      ((trackingData.destination.lat - driverPosition.lat) * Math.PI) / 180;
    const dLon =
      ((trackingData.destination.lng - driverPosition.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((driverPosition.lat * Math.PI) / 180) *
        Math.cos((trackingData.destination.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance.toFixed(1);
  };

  console.log("Render decision:", {
    orderStatus,
    shouldShow: orderStatus === "shipped",
    isLoading,
    hasData: !!trackingData,
  });

  if (orderStatus !== "shipped") {
    console.log("Not rendering - status not shipped");
    return null;
  }

  if (isLoading) {
    console.log("Rendering loading state");
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: "32px",
            height: "32px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #0066cc",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: "1rem", color: "#666" }}>Loading tracking...</p>
      </div>
    );
  }

  if (!trackingData) {
    console.log("Not rendering - no tracking data");
    return null;
  }

  console.log("Rendering full map component!");
  const distance = calculateDistance();

  return (
    <div style={{ padding: "2rem", borderBottom: "1px solid #f0f0f0" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          Live Tracking
        </h3>
        {isDelivered && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#22c55e",
              fontWeight: "600",
              animation: "bounce 1s infinite",
            }}
          >
            Paket Telah Sampai!
          </div>
        )}
      </div>

      {/* Driver Info Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.5rem",
          border: "1px solid #60a5fa",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
            <div>
              <h4
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                {driverPosition?.name || "Driver BookPort"}
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                {driverPosition?.phone || "081234567890"}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                {driverPosition?.vehicle || "Motor"}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#3b82f6",
                  marginTop: "0.5rem",
                }}
              >
                Tujuan: {trackingData.city}
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                color: "#ea580c",
                fontWeight: "700",
                fontSize: "16px",
                marginBottom: "0.25rem",
              }}
            >
              {trackingData.estimated_arrival}
            </div>
            <p style={{ fontSize: "11px", color: "#666" }}>Estimasi Tiba</p>
            {distance && (
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <strong>{distance} km</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div
        style={{
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          border: "2px solid #e5e7eb",
          height: "400px",
        }}
      >
        {driverPosition && trackingData.destination ? (
          <MapContainer
            center={[driverPosition.lat, driverPosition.lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <AutoCenter position={driverPosition} />

            <Marker
              position={[driverPosition.lat, driverPosition.lng]}
              icon={driverIcon}
            >
              <Popup>
                <div style={{ textAlign: "center", fontWeight: "600" }}>
                  <strong>{driverPosition.name}</strong>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "0.25rem",
                    }}
                  >
                    Sedang dalam perjalanan
                  </p>
                  {distance && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#3b82f6",
                        marginTop: "0.25rem",
                      }}
                    >
                      {distance} km dari tujuan
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>

            <Marker
              position={[
                trackingData.destination.lat,
                trackingData.destination.lng,
              ]}
              icon={destinationIcon}
            >
              <Popup>
                <div style={{ textAlign: "center", fontWeight: "600" }}>
                  <strong>Tujuan Pengiriman</strong>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "0.25rem",
                    }}
                  >
                    {trackingData.city}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#999",
                      marginTop: "0.25rem",
                    }}
                  >
                    Alamat Anda
                  </p>
                </div>
              </Popup>
            </Marker>

            <Polyline
              positions={[
                [driverPosition.lat, driverPosition.lng],
                [trackingData.destination.lat, trackingData.destination.lng],
              ]}
              color="#3b82f6"
              weight={4}
              opacity={0.7}
              dashArray="10, 10"
            />
          </MapContainer>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  width: "48px",
                  height: "48px",
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "0.75rem",
                }}
              />
              <p style={{ color: "#6b7280", fontWeight: "500" }}>
                Memuat peta...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Info Footer */}
      <div
        style={{
          marginTop: "1rem",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          padding: "0.75rem",
          textAlign: "center",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontSize: "13px",
            color: "#374151",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "#22c55e",
              borderRadius: "50%",
              animation: "pulse 2s infinite",
            }}
          />
          <p style={{ fontWeight: "500" }}>
            Driver sedang dalam perjalanan menuju {trackingData.city}
          </p>
        </div>
        <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "0.25rem" }}>
          Last update:{" "}
          {driverPosition?.timestamp
            ? new Date(driverPosition.timestamp).toLocaleTimeString("id-ID")
            : "-"}
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

// Main Component
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
      console.log("📦 Order data fetched:", res.data);
      console.log("📦 Order status:", res.data.pesanan.status_pesanan);
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
        date: createdDate,
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

        {/* Live Tracking - Insert Here */}
        <LiveTracking
          orderId={pesanan.id}
          orderStatus={pesanan.status_pesanan}
        />

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
                  <div style={{ fontSize: "12px", opacity: 0.9 }}>Paid via</div>
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

              <a
                href={`https://sepolia.etherscan.io/tx/${pesanan.blockchain_tx_hash}`}
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
