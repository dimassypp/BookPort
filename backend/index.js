require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const midtransClient = require("midtrans-client");
const { ethers } = require("ethers");
const db = require("./db");
const abi = require("./abi.json");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const cron = require("node-cron");
const http = require("http");
const socketIo = require("socket.io");

// ===================================
// INISIALISASI APLIKASI
// ===================================
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 5000;

// ===================================
// TRACKING HELPERS 
// ===================================

// Simpan data tracking aktif di memori
const activeDeliveries = new Map();

// Fungsi Koordinat Kota
const getCityCoordinates = (cityName) => {
  const city = cityName.toLowerCase();
  
  const coordinates = {
    "jakarta": { lat: -6.2088, lng: 106.8456 },
    "surabaya": { lat: -7.2575, lng: 112.7521 },
    "bandung": { lat: -6.9175, lng: 107.6191 },
    "medan": { lat: 3.5952, lng: 98.6722 },
    "semarang": { lat: -6.9667, lng: 110.4167 },
    "makassar": { lat: -5.1477, lng: 119.4328 },
    "palembang": { lat: -2.9909, lng: 104.7567 },
    "denpasar": { lat: -8.6705, lng: 115.2126 },
    "malang": { lat: -7.9666, lng: 112.6326 },
    "yogyakarta": { lat: -7.7955, lng: 110.3695 },
    "default": { lat: -6.2000, lng: 106.8166 } 
  };

  // Cek apakah nama kota mengandung key di atas
  const foundKey = Object.keys(coordinates).find(key => city.includes(key));
  return foundKey ? coordinates[foundKey] : coordinates["default"];
};

// Fungsi Simulasi Driver (Statis & Manual Complete oleh Admin)
const simulateDriverMovement = (orderId, startPos, endPos) => {
  if (activeDeliveries.has(orderId) && activeDeliveries.get(orderId).interval) {
    clearInterval(activeDeliveries.get(orderId).interval);
  }

  const interval = setInterval(() => {
    
    const currentPos = {
      lat: startPos.lat, 
      lng: startPos.lng, 
      name: "Driver BookPort",
      phone: "081234567890",
      vehicle: "Motor",
      timestamp: new Date() 
    };

    // Update data di memori server
    activeDeliveries.set(orderId, { ...currentPos, interval });

    // Kirim ke Frontend via Socket.io
    io.emit("driver_position", currentPos);

  }, 5000); 
};

// ===================================
// MIDDLEWARE
// ===================================
app.use(cors());
app.use(express.json());

// Setup upload directory
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// ===================================
// EXTERNAL CLIENTS
// ===================================

// Midtrans
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Blockchain (Ethers.js)
const provider = new ethers.providers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL
);
const wallet = new ethers.Wallet(
  process.env.SERVER_WALLET_PRIVATE_KEY,
  provider
);
const bookPortContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

// ===================================
// AUTHENTICATION MIDDLEWARE
// ===================================

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Tidak ada token, otorisasi ditolak" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token tidak valid" });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "Akses ditolak. Hanya untuk admin." });
    }
  });
};

// ===================================
// PUBLIC ENDPOINTS
// ===================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// GET: All books
app.get("/api/buku", async (req, res) => {
  const { q, category } = req.query;

  try {
    let sql = "SELECT * FROM buku WHERE 1=1";
    const params = [];

    // Search by query (title or author)
    if (q) {
      sql += " AND (judul LIKE ? OR penulis LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    // Filter by category
    if (category) {
      sql += " AND kategori = ?";
      params.push(category);
    }

    sql += " ORDER BY judul ASC";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error saat mengambil buku" });
  }
});

// GET: Single book
app.get("/api/buku/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM buku WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Buku tidak ditemukan" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Server error saat mengambil detail buku" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT kategori 
      FROM buku 
      WHERE kategori IS NOT NULL 
      AND kategori != '' 
      ORDER BY kategori ASC
    `);

    const categories = rows.map((row) => row.kategori);

    console.log("Categories fetched:", categories);

    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===================================
// AUTHENTICATION ENDPOINTS
// ===================================

// POST: Register
app.post("/api/register", async (req, res) => {
  const { name, email, password, no_hp } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Nama, email, dan password wajib diisi" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  try {
    const [userExists] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (userExists.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      "INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, 'user')",
      [name, email, hashedPassword, no_hp || null]
    );

    res.status(201).json({
      message: "Registrasi berhasil",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res
      .status(500)
      .json({ message: "Server error saat registrasi: " + err.message });
  }
});

// POST: Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(400).json({ message: "Email atau password salah" });
    }
    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    const payload = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });
    res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ message: "Server error saat login: " + err.message });
  }
});

// ===================================
// USER ENDPOINTS (PROTECTED)
// ===================================

// GET: Profile
app.get("/api/profile", auth, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, nama, email, no_hp, alamat, role FROM users WHERE id = ?",
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json(users[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Update profile
app.put("/api/profile", auth, async (req, res) => {
  const { nama, no_hp, alamat } = req.body;
  try {
    await db.query(
      "UPDATE users SET nama = ?, no_hp = ?, alamat = ? WHERE id = ?",
      [nama, no_hp, alamat, req.user.id]
    );
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: User's orders
app.get("/api/pesanan", auth, async (req, res) => {
  try {
    const [pesanan] = await db.query(
      `SELECT 
         p.id, p.order_number, p.created_at, p.total_harga, p.status_pembayaran, p.status_pesanan, p.midtrans_order_id,
         (SELECT dp.jumlah FROM detail_pesanan dp WHERE dp.pesanan_id = p.id LIMIT 1) as item_jumlah,
         (SELECT b.judul FROM detail_pesanan dp JOIN buku b ON dp.buku_id = b.id WHERE dp.pesanan_id = p.id LIMIT 1) as item_judul,
         (SELECT b.gambar_url FROM detail_pesanan dp JOIN buku b ON dp.buku_id = b.id WHERE dp.pesanan_id = p.id LIMIT 1) as item_gambar,
         (SELECT COUNT(*) FROM detail_pesanan dp WHERE dp.pesanan_id = p.id) as total_item
       FROM pesanan p 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(pesanan);
  } catch (err) {
    console.error("Error fetching order history:", err);
    res
      .status(500)
      .json({ message: "Server error saat mengambil riwayat pesanan" });
  }
});

// GET: Order detail
app.get("/api/pesanan/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [pesanan] = await db.query(
      "SELECT *, order_number, payment_method FROM pesanan WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );
    if (pesanan.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }
    const [detail] = await db.query(
      "SELECT d.*, b.judul, b.gambar_url, b.penulis FROM detail_pesanan d JOIN buku b ON d.buku_id = b.id WHERE d.pesanan_id = ?",
      [id]
    );
    res.json({ pesanan: pesanan[0], detail: detail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Blockchain status
app.get("/api/pesanan/:id/blockchain", auth, async (req, res) => {
  try {
    const [pesanan] = await db.query(
      "SELECT blockchain_tx_hash FROM pesanan WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (pesanan.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }
    const txHash = pesanan[0].blockchain_tx_hash;
    if (!txHash) {
      return res.json({
        recorded: false,
        message: "Belum tercatat di blockchain",
      });
    }
    const receipt = await provider.getTransactionReceipt(txHash);
    res.json({
      recorded: true,
      transaction_hash: txHash,
      block_number: receipt.blockNumber,
      confirmations: receipt.confirmations,
      status: receipt.status === 1 ? "success" : "failed",
      explorer_url: `https://sepolia.etherscan.io/tx/${txHash}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking blockchain status" });
  }
});

// POST: Retry payment for pending orders
app.post("/api/retry-payment", auth, async (req, res) => {
  const { order_id } = req.body;
  try {
    const [pesanan] = await db.query(
      "SELECT * FROM pesanan WHERE midtrans_order_id = ? AND user_id = ?",
      [order_id, req.user.id]
    );

    if (pesanan.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const order = pesanan[0];

    if (order.status_pembayaran !== "pending") {
      return res.status(400).json({
        message: `Order sudah ${order.status_pembayaran}. Tidak bisa retry.`,
      });
    }

    const new_midtrans_order_id = `BOOKPORT-${order.id}-RETRY-${Date.now()}`;

    await db.query("UPDATE pesanan SET midtrans_order_id = ? WHERE id = ?", [
      new_midtrans_order_id,
      order.id,
    ]);

    const alamat_pengiriman = JSON.parse(order.alamat_pengiriman);

    const parameter = {
      transaction_details: {
        order_id: new_midtrans_order_id,
        gross_amount: parseInt(order.total_harga),
      },
      customer_details: {
        first_name: alamat_pengiriman.first_name || req.user.nama,
        last_name: alamat_pengiriman.last_name || "",
        email: req.user.email,
        phone: alamat_pengiriman.phone_number || "08123456789",
      },
      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/riwayat`,
        unfinish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
        error: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
      },
    };

    console.log(
      `[RETRY PAYMENT] Generating new token for order: ${new_midtrans_order_id}`
    );
    const snapToken = await snap.createTransactionToken(parameter);
    res.json({
      snapToken,
      order_id: new_midtrans_order_id,
    });
  } catch (err) {
    console.error("[RETRY PAYMENT ERROR]", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ===================================
// CHECKOUT & PAYMENT
// ===================================

// POST: Checkout
app.post("/api/checkout", auth, async (req, res) => {
  const { alamat_pengiriman, cart_items, ongkir } = req.body;
  const userId = req.user.id;

  if (!cart_items || cart_items.length === 0) {
    return res.status(400).json({ message: "Keranjang Anda kosong" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Validasi buku
    const ids = cart_items.map((item) => item.buku_id);
    const [bukuDb] = await connection.query(
      `SELECT id, judul, harga, stok FROM buku WHERE id IN (${ids.join(",")})`
    );

    let total_harga = ongkir || 0;
    let detailPesananData = [];

    for (const item of cart_items) {
      const buku = bukuDb.find((b) => b.id === item.buku_id);
      if (!buku) {
        throw new Error(`Buku dengan ID ${item.buku_id} tidak ditemukan`);
      }
      if (buku.stok < item.jumlah) {
        throw new Error(
          `Stok ${buku.judul} tidak mencukupi (sisa ${buku.stok})`
        );
      }
      const hargaItem = buku.harga * item.jumlah;
      total_harga += hargaItem;
      detailPesananData.push({
        buku_id: item.buku_id,
        jumlah: item.jumlah,
        harga_saat_beli: buku.harga,
      });

      // Kurangi stok
      await connection.query("UPDATE buku SET stok = stok - ? WHERE id = ?", [
        item.jumlah,
        item.buku_id,
      ]);
    }

    const midtrans_order_id = `BOOKPORT-${userId}-${Date.now()}`;

    // Insert pesanan
    const [pesananResult] = await connection.query(
      `INSERT INTO pesanan 
        (user_id, total_harga, status_pembayaran, status_pesanan, alamat_pengiriman, ongkir, midtrans_order_id) 
        VALUES (?, ?, 'pending', 'waiting_payment', ?, ?, ?)`,
      [
        userId,
        total_harga,
        JSON.stringify(alamat_pengiriman),
        ongkir || 0,
        midtrans_order_id,
      ]
    );

    const pesananId = pesananResult.insertId;

    // Generate user-friendly order number
    const order_number = `BP-${String(pesananId).padStart(5, "0")}`;
    await connection.query("UPDATE pesanan SET order_number = ? WHERE id = ?", [
      order_number,
      pesananId,
    ]);

    // Insert detail pesanan
    for (const detail of detailPesananData) {
      await connection.query(
        "INSERT INTO detail_pesanan (pesanan_id, buku_id, jumlah, harga_saat_beli) VALUES (?, ?, ?, ?)",
        [pesananId, detail.buku_id, detail.jumlah, detail.harga_saat_beli]
      );
    }

    // Midtrans transaction
    const parameter = {
      transaction_details: {
        order_id: midtrans_order_id,
        gross_amount: total_harga,
      },
      customer_details: {
        first_name: alamat_pengiriman.first_name || req.user.nama,
        last_name: alamat_pengiriman.last_name || "",
        email: req.user.email,
        phone: alamat_pengiriman.phone_number || "08123456789",
      },
      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/riwayat`,
        unfinish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
        error: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
      },
    };

    const snapToken = await snap.createTransactionToken(parameter);

    await connection.commit();

    res.status(200).json({
      snapToken,
      order_id: midtrans_order_id,
      order_number: order_number,
      pesanan_id: pesananId,
    });
  } catch (err) {
    await connection.rollback();
    console.error("[CHECKOUT ERROR]", err);
    res
      .status(500)
      .json({ message: err.message || "Server error saat checkout" });
  } finally {
    connection.release();
  }
});

// POST: Midtrans webhook
app.post("/api/midtrans-notification", async (req, res) => {
  const notificationJson = req.body;
  // try {
  //   const rawJson = JSON.stringify(notificationJson);
  //   const amount = notificationJson.gross_amount
  //     ? parseFloat(notificationJson.gross_amount)
  //     : 0;

  //   await db.query(
  //     `INSERT INTO webhook_logs
  //       (order_id, transaction_status, fraud_status, payment_type, gross_amount, raw_notification, processed_at)
  //      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
  //     [
  //       notificationJson.order_id || null,
  //       notificationJson.transaction_status || null,
  //       notificationJson.fraud_status || null,
  //       notificationJson.payment_type || null,
  //       amount,
  //       rawJson,
  //     ]
  //   );
  //   console.log(
  //     `[WEBHOOK LOG] Log tersimpan untuk Order ID: ${notificationJson.order_id}`
  //   );
  // } catch (logErr) {
  //   // Hanya console error, jangan res.status(500) agar proses utama tetap jalan
  //   console.error("[WEBHOOK LOG ERROR] Gagal menyimpan log:", logErr.message);
  // }

  try {
    const statusResponse = await snap.transaction.notification(
      notificationJson
    );
    const order_id = statusResponse.order_id;
    const transaction_status = statusResponse.transaction_status;
    const fraud_status = statusResponse.fraud_status;
    const status_code = statusResponse.status_code;
    const gross_amount = statusResponse.gross_amount;
    const payment_type = statusResponse.payment_type;

    // Signature validation
    const signatureKey = statusResponse.signature_key;
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(
        `${order_id}${status_code}${gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
      )
      .digest("hex");

    if (signatureKey !== calculatedSignature) {
      console.error("[WEBHOOK] Invalid signature!");
      return res.status(403).send("Invalid signature");
    }

    const [existingPaid] = await db.query(
      "SELECT * FROM pesanan WHERE midtrans_order_id = ? AND status_pembayaran = 'paid'",
      [order_id]
    );
    if (existingPaid.length > 0) {
      return res.status(200).send("Already processed");
    }

    // Mapping payment_type ke format yang lebih readable
    const paymentMethodMap = {
      credit_card: "Credit Card",
      bank_transfer: "Bank Transfer",
      echannel: "Mandiri Bill",
      bca_va: "BCA Virtual Account",
      bni_va: "BNI Virtual Account",
      bri_va: "BRI Virtual Account",
      permata_va: "Permata Virtual Account",
      other_va: "Virtual Account",
      gopay: "GoPay",
      shopeepay: "ShopeePay",
      qris: "QRIS",
      indomaret: "Indomaret",
      alfamart: "Alfamart",
      akulaku: "Akulaku",
    };

    const payment_method = paymentMethodMap[payment_type] || payment_type;

    // Payment success
    if (transaction_status == "capture" || transaction_status == "settlement") {
      if (fraud_status == "accept" || transaction_status == "settlement") {
        await db.query(
          `UPDATE pesanan 
           SET status_pembayaran = 'paid', 
               status_pesanan = 'processing',
               payment_method = ?, 
               updated_at = NOW() 
           WHERE midtrans_order_id = ?`,
          [payment_method, order_id]
        );

        const [pesanan] = await db.query(
          "SELECT id, user_id, total_harga FROM pesanan WHERE midtrans_order_id = ?",
          [order_id]
        );
        if (pesanan.length > 0) {
          const p = pesanan[0];
          bookPortContract
            .addReceipt(p.id, p.user_id.toString(), p.total_harga)
            .then((tx) => tx.wait())
            .then((receipt) => {
              db.query(
                "UPDATE pesanan SET blockchain_tx_hash = ? WHERE id = ?",
                [receipt.transactionHash, p.id]
              );
            })
            .catch((err) => {
              console.error("[BLOCKCHAIN ERROR]", err.message);
              db.query(
                "INSERT INTO blockchain_retry_queue (pesanan_id, error_message) VALUES (?, ?)",
                [p.id, err.message]
              ).catch((queueErr) =>
                console.error("Failed to queue retry:", queueErr)
              );
            });
        }
      }
    }
    // Payment pending
    else if (transaction_status == "pending") {
      // Update payment method meskipun pending
      await db.query(
        `UPDATE pesanan 
         SET payment_method = ?
         WHERE midtrans_order_id = ?`,
        [payment_method, order_id]
      );
    }
    // Payment failed
    else if (
      transaction_status == "deny" ||
      transaction_status == "cancel" ||
      transaction_status == "expire"
    ) {
      await db.query(
        `UPDATE pesanan 
         SET status_pembayaran = 'failed', 
             status_pesanan = 'cancelled',
             payment_method = ?,
             updated_at = NOW()
         WHERE midtrans_order_id = ?`,
        [payment_method, order_id]
      );

      // Restore stock
      const [details] = await db.query(
        `SELECT d.buku_id, d.jumlah 
         FROM detail_pesanan d
         JOIN pesanan p ON d.pesanan_id = p.id
         WHERE p.midtrans_order_id = ?`,
        [order_id]
      );
      for (const item of details) {
        await db.query("UPDATE buku SET stok = stok + ? WHERE id = ?", [
          item.jumlah,
          item.buku_id,
        ]);
      }
    }
    res.status(200).send("OK");
  } catch (err) {
    console.error("[WEBHOOK ERROR]", err);
    res.status(200).send("Error processed");
  }
});

// ===================================
// ADMIN ENDPOINTS
// ===================================

// POST: Add book
app.post(
  "/api/admin/buku",
  adminAuth,
  upload.single("gambar_file"),
  async (req, res) => {
    const {
      judul,
      penulis,
      tahun_terbit,
      deskripsi,
      kategori,
      harga,
      stok,
      bahasa,
    } = req.body;
    let gambar_url = null;
    if (req.file) {
      gambar_url = `/uploads/${req.file.filename}`;
    }
    if (!judul || !penulis || !harga || !stok) {
      return res
        .status(400)
        .json({ message: "Judul, penulis, harga, dan stok wajib diisi" });
    }
    try {
      const [result] = await db.query(
        "INSERT INTO buku (judul, penulis, tahun_terbit, deskripsi, kategori, bahasa, harga, stok, gambar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          judul,
          penulis,
          tahun_terbit,
          deskripsi,
          kategori,
          bahasa || "English",
          harga,
          stok,
          gambar_url,
        ]
      );
      res.status(201).json({
        message: "Buku berhasil ditambahkan",
        bookId: result.insertId,
      });
    } catch (err) {
      console.error("Admin add book error:", err);
      res.status(500).json({ message: "Server error saat menambah buku" });
    }
  }
);

// PUT: Update book
app.put("/api/admin/buku/:id", adminAuth, async (req, res) => {
  const { judul, penulis, harga, stok } = req.body;
  try {
    await db.query(
      "UPDATE buku SET judul=?, penulis=?, harga=?, stok=? WHERE id=?",
      [judul, penulis, harga, stok, req.params.id]
    );
    res.json({ message: "Buku berhasil diupdate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE: Delete book
app.delete("/api/admin/buku/:id", adminAuth, async (req, res) => {
  try {
    const [buku] = await db.query("SELECT gambar_url FROM buku WHERE id = ?", [
      req.params.id,
    ]);

    if (buku.length === 0) {
      return res.status(404).json({ message: "Buku tidak ditemukan" });
    }

    await db.query("DELETE FROM buku WHERE id = ?", [req.params.id]);

    if (buku[0].gambar_url) {
      const imgPath = path.join(__dirname, "public", buku[0].gambar_url);
      if (fs.existsSync(imgPath)) {
        fs.unlink(imgPath, (err) => {
          if (err) console.error("Gagal hapus file:", err);
        });
      }
    }

    res.json({ message: "Buku berhasil dihapus" });
  } catch (err) {
    console.error("Admin delete book error:", err);

    if (
      err.code === "ER_ROW_IS_REFERENCED_2" ||
      err.code === "ER_ROW_IS_REFERENCED"
    ) {
      return res.status(400).json({
        message:
          "Gagal hapus: Buku ini ada dalam riwayat pesanan orang lain. Mohon ubah stok menjadi 0 saja untuk menyembunyikannya.",
      });
    }

    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// GET: All orders (admin)
app.get("/api/admin/pesanan", adminAuth, async (req, res) => {
  try {
    const [pesanan] = await db.query(`
      SELECT p.*, u.nama AS user_nama, u.email AS user_email
      FROM pesanan p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    // Normalize status for frontend (convert underscore to space)
    const normalizedPesanan = pesanan.map((p) => ({
      ...p,
      status_pesanan: p.status_pesanan.replace(/_/g, " "),
    }));

    res.json(normalizedPesanan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Order detail (admin)
app.get("/api/admin/pesanan/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await db.query(
      `SELECT p.*, u.nama AS user_nama, u.email AS user_email, u.no_hp AS user_phone
       FROM pesanan p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT 
        d.id,
        d.buku_id,
        d.jumlah,
        d.harga_saat_beli as harga,
        b.judul,
        b.penulis,
        b.gambar_url as cover_image
       FROM detail_pesanan d 
       JOIN buku b ON d.buku_id = b.id 
       WHERE d.pesanan_id = ?`,
      [id]
    );

    order.items = items;

    // Parse alamat_pengiriman if JSON
    if (
      order.alamat_pengiriman &&
      typeof order.alamat_pengiriman === "string"
    ) {
      try {
        const parsed = JSON.parse(order.alamat_pengiriman);
        order.alamat_pengiriman = `${parsed.address || ""}, ${
          parsed.city || ""
        }, ${parsed.province || ""} ${parsed.postal_code || ""}`.trim();
      } catch (e) {
        // Keep as is
      }
    }

    res.json(order);
  } catch (err) {
    console.error("Error fetching order detail:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Update order status (admin)
app.put("/api/admin/pesanan/:id/status", adminAuth, async (req, res) => {
  const { status_pesanan } = req.body;
  const { id } = req.params;

  const allowedStatuses = [
    "waiting payment",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];

  if (!status_pesanan || !allowedStatuses.includes(status_pesanan)) {
    return res.status(400).json({
      message:
        "Status tidak valid. Pilih: waiting payment, processing, shipped, completed, cancelled",
    });
  }

  try {
    const [orders] = await db.query("SELECT * FROM pesanan WHERE id = ?", [id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const currentOrder = orders[0];
    const currentStatus = currentOrder.status_pesanan.replace("_", " ");

    // Validasi transisi status
    const validTransitions = {
      "waiting payment": ["cancelled"], // Hanya bisa cancel sebelum bayar
      processing: ["shipped", "cancelled"], // Bisa cancel jika belum dikirim
      shipped: ["completed"], // Tidak bisa cancel jika sudah dikirim
      completed: [], // Final state
      cancelled: [], // Final state
    };

    const allowedNext = validTransitions[currentStatus];

    if (allowedNext && !allowedNext.includes(status_pesanan)) {
      return res.status(400).json({
        message: `Tidak bisa mengubah status dari "${currentStatus}" ke "${status_pesanan}"`,
      });
    }

    if (status_pesanan === "cancelled") {
      // Kembalikan stok buku
      const [details] = await db.query(
        `SELECT d.buku_id, d.jumlah 
         FROM detail_pesanan d
         WHERE d.pesanan_id = ?`,
        [id]
      );

      for (const item of details) {
        await db.query("UPDATE buku SET stok = stok + ? WHERE id = ?", [
          item.jumlah,
          item.buku_id,
        ]);
      }

      if (currentOrder.status_pembayaran === "paid") {
        // Ubah status pembayaran menjadi "refunded"
        await db.query(
          `UPDATE pesanan 
           SET status_pesanan = ?, 
               status_pembayaran = 'refunded',
               updated_at = NOW() 
           WHERE id = ?`,
          [status_pesanan, id]
        );

        // Log untuk admin bahwa perlu manual refund via Midtrans
        console.log(
          `[REFUND NEEDED] Order ${currentOrder.midtrans_order_id} - Rp ${currentOrder.total_harga}`
        );

        const [updatedOrders] = await db.query(
          `SELECT p.*, u.nama AS user_nama, u.email AS user_email
           FROM pesanan p
           JOIN users u ON p.user_id = u.id
           WHERE p.id = ?`,
          [id]
        );

        return res.json({
          message:
            "Pesanan dibatalkan. Refund perlu diproses manual via Midtrans Dashboard.",
          order: updatedOrders[0],
          refund_required: true,
          refund_amount: currentOrder.total_harga,
        });
      }
    }

    await db.query(
      "UPDATE pesanan SET status_pesanan = ?, updated_at = NOW() WHERE id = ?",
      [status_pesanan, id]
    );

    // Auto-start tracking saat status "shipped"
    if (status_pesanan === "shipped") {
      const [orders] = await db.query("SELECT * FROM pesanan WHERE id = ?", [
        id,
      ]);
      if (orders.length > 0) {
        const order = orders[0];

        let cityName = "default";
        try {
          const alamat = JSON.parse(order.alamat_pengiriman);
          cityName = alamat.city || alamat.province || "default";
        } catch (e) {
          cityName = "default";
        }

        const destination = getCityCoordinates(cityName);

        const driverPosition = {
          lat: destination.lat - 0.05,
          lng: destination.lng - 0.05,
          name: "Driver BookPort",
          phone: "081234567890",
          vehicle: "Motor",
          timestamp: new Date(),
        };

        activeDeliveries.set(parseInt(id), driverPosition);
        simulateDriverMovement(parseInt(id), driverPosition, destination);

        console.log(`[TRACKING] Started for order ${id} to ${cityName}`);
      }
    }

    // Clear tracking setelah completed
    if (status_pesanan === "completed" || status_pesanan === "cancelled") {
      activeDeliveries.delete(parseInt(id));
      io.to(`order_${id}`).emit("tracking_ended", {
        orderId: id,
        status: status_pesanan,
      });
      console.log(`[TRACKING] Stopped for order ${id}`);
    }

    const [updatedOrders] = await db.query(
      `SELECT p.*, u.nama AS user_nama, u.email AS user_email
       FROM pesanan p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    res.json({
      message: "Status berhasil diupdate",
      order: updatedOrders[0],
    });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/pesanan/:id/tracking", auth, async (req, res) => {
  try {
    const [pesanan] = await db.query(
      "SELECT * FROM pesanan WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );

    if (pesanan.length === 0) {
      return res.status(404).json({ message: "Pesanan tidak ditemukan" });
    }

    const order = pesanan[0];

    if (order.status_pesanan !== "shipped") {
      return res.json({
        tracking_available: false,
        status: order.status_pesanan,
      });
    }

    let cityName = "default";
    try {
      const alamat = JSON.parse(order.alamat_pengiriman);
      cityName = alamat.city || alamat.province || "default";
    } catch (e) {
      console.log("Failed to parse alamat:", e);
    }

    const destination = getCityCoordinates(cityName);
    const driverPosition = activeDeliveries.get(parseInt(req.params.id));

    res.json({
      tracking_available: true,
      order_id: order.id,
      order_number: order.order_number,
      city: cityName,
      destination: destination,
      driver: driverPosition || {
        lat: destination.lat - 0.05,
        lng: destination.lng - 0.05,
        name: "Driver BookPort",
        phone: "081234567890",
        vehicle: "Motor",
      },
      estimated_arrival: "30-45 menit",
    });
  } catch (err) {
    console.error("Tracking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Revenue statistics (admin)
app.get("/api/admin/revenue", adminAuth, async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        SUM(total_harga) as total_revenue,
        COUNT(*) as completed_orders
      FROM pesanan 
      WHERE status_pembayaran = 'paid' 
      AND status_pesanan NOT IN ('cancelled')
    `);

    res.json({
      total_revenue: result[0].total_revenue || 0,
      completed_orders: result[0].completed_orders || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Retry blockchain recording (admin)
app.post("/api/admin/retry-blockchain/:id", adminAuth, async (req, res) => {
  try {
    const [pesanan] = await db.query(
      "SELECT id, user_id, total_harga, blockchain_tx_hash FROM pesanan WHERE id = ? AND status_pembayaran = 'paid'",
      [req.params.id]
    );
    if (pesanan.length === 0) {
      return res
        .status(404)
        .json({ message: "Pesanan tidak ditemukan atau belum dibayar" });
    }
    const p = pesanan[0];
    if (p.blockchain_tx_hash) {
      return res.status(400).json({ message: "Sudah tercatat di blockchain" });
    }
    const tx = await bookPortContract.addReceipt(
      p.id,
      p.user_id.toString(),
      p.total_harga
    );
    await tx.wait();
    await db.query("UPDATE pesanan SET blockchain_tx_hash = ? WHERE id = ?", [
      tx.hash,
      p.id,
    ]);
    res.json({
      success: true,
      transaction_hash: tx.hash,
      message: "Berhasil dicatat ke blockchain",
    });
  } catch (err) {
    console.error("[ADMIN RETRY ERROR]", err);
    res.status(500).json({ message: err.message });
  }
});

// API TEST MIDTRANS
app.post("/api/test-midtrans", auth, async (req, res) => {
  try {
    const testOrderId = `TEST-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: testOrderId,
        gross_amount: 100000, // Test dengan nominal fixed
      },
      customer_details: {
        first_name: "Test User",
        last_name: "BookPort",
        email: "test@bookport.com",
        phone: "08123456789",
      },
      callbacks: {
        finish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/riwayat`,
        unfinish: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
        error: `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/checkout`,
      },
    };

    console.log("=== MIDTRANS TEST REQUEST ===");
    console.log(
      "Server Key:",
      process.env.MIDTRANS_SERVER_KEY?.substring(0, 20) + "..."
    );
    console.log("Parameter:", JSON.stringify(parameter, null, 2));
    console.log("============================");

    const snapToken = await snap.createTransactionToken(parameter);

    console.log("SUCCESS - Token:", snapToken.substring(0, 30) + "...");

    res.json({
      success: true,
      snapToken,
      message: "Midtrans working properly",
      testOrderId,
    });
  } catch (err) {
    console.error("MIDTRANS TEST FAILED:");
    console.error("Error Message:", err.message);
    console.error("Error Code:", err.code);
    console.error("Status Code:", err.statusCode);
    console.error("API Response:", err.ApiResponse);
    console.error("Full Error:", JSON.stringify(err, null, 2));

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      statusCode: err.statusCode,
      apiResponse: err.ApiResponse,
      hint: "Check console for full error details",
    });
  }
});

// ===================================
// CRON JOB
// ===================================
cron.schedule("0 * * * *", async () => {
  console.log("[CRON] Checking for expired unpaid orders...");
  try {
    const [expiredOrders] = await db.query(`
      SELECT p.id, p.midtrans_order_id 
      FROM pesanan p
      WHERE p.status_pembayaran = 'pending' 
      AND p.created_at < NOW() - INTERVAL 24 HOUR
    `);
    if (expiredOrders.length === 0) {
      console.log("[CRON] No expired orders found.");
      return;
    }
    for (const order of expiredOrders) {
      console.log(
        `[CRON] Cancelling expired order: ${order.midtrans_order_id}`
      );
      await db.query(
        `UPDATE pesanan 
         SET status_pembayaran = 'failed', 
             status_pesanan = 'cancelled',
             updated_at = NOW()
         WHERE id = ?`,
        [order.id]
      );

      const [details] = await db.query(
        `SELECT d.buku_id, d.jumlah 
         FROM detail_pesanan d
         WHERE d.pesanan_id = ?`,
        [order.id]
      );
      for (const item of details) {
        await db.query("UPDATE buku SET stok = stok + ? WHERE id = ?", [
          item.jumlah,
          item.buku_id,
        ]);
      }
    }
    console.log(`[CRON] Cancelled ${expiredOrders.length} expired orders`);
  } catch (err) {
    console.error("[CRON ERROR]", err);
  }
});

// // SIMULASI AUTO PAY KARENA MIDTRANS ERROR
// app.post("/api/simulate-payment", auth, async (req, res) => {
//   const { order_id } = req.body;

//   try {
//     console.log(`[AUTO-PAY] Simulating success for order: ${order_id}`);

//     // Paksa Update Status di Database menjadi PAID
//     await db.query(
//       `UPDATE pesanan
//        SET status_pembayaran = 'paid',
//            status_pesanan = 'processing',
//            updated_at = NOW()
//        WHERE midtrans_order_id = ?`,
//       [order_id]
//     );

//     // Logika tambahan: Kurangi Stok & Catat Blockchain (Manual karena tidak lewat webhook)
//     const [pesanan] = await db.query(
//         "SELECT id, user_id, total_harga FROM pesanan WHERE midtrans_order_id = ?",
//         [order_id]
//     );

//     if (pesanan.length > 0) {
//         const p = pesanan[0];

//         // a. Kurangi Stok Buku
//         const [details] = await db.query(
//             "SELECT buku_id, jumlah FROM detail_pesanan WHERE pesanan_id = ?",
//             [p.id]
//         );
//         for (const item of details) {
//             await db.query("UPDATE buku SET stok = stok - ? WHERE id = ?", [item.jumlah, item.buku_id]);
//         }

//         bookPortContract.addReceipt(p.id, p.user_id.toString(), p.total_harga)
//             .then(tx => tx.wait())
//             .then(receipt => {
//                 console.log("[AUTO-PAY] Blockchain recorded:", receipt.transactionHash);
//                 db.query("UPDATE pesanan SET blockchain_tx_hash = ? WHERE id = ?", [receipt.transactionHash, p.id]);
//             })
//             .catch(err => console.error("[AUTO-PAY BLOCKCHAIN SKIP] Mining failed or pending:", err.message));
//     }

//     res.json({ message: "Payment Auto-Completed Successfully" });

//   } catch (err) {
//     console.error("[AUTO-PAY ERROR]", err);
//     res.status(500).json({ message: "Simulasi Gagal" });
//   }
// });

// ===================================
// START SERVER
// ===================================
server.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log(`Socket.IO tracking enabled`);
  console.log(`Database: ${process.env.DB_NAME || "bookport_db"}`);
  console.log(
    `JWT Secret: ${process.env.JWT_SECRET ? "✓ Configured" : "✗ Missing"}`
  );
  console.log(
    `Midtrans: ${
      process.env.MIDTRANS_SERVER_KEY ? "✓ Configured" : "✗ Missing"
    }`
  );
  console.log(
    `Blockchain: ${process.env.CONTRACT_ADDRESS ? "✓ Configured" : "✗ Missing"}`
  );
});