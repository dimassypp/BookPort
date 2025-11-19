import React, { useState, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const AdminPage = () => {
  const { token } = useContext(AuthContext);

  // State untuk data teks dari form
  const [formData, setFormData] = useState({
    judul: "",
    penulis: "",
    tahun_terbit: "",
    deskripsi: "",
    kategori: "",
    harga: "",
    stok: "",
    bahasa: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [message, setMessage] = useState("");

  // Fungsi ini menangani input teks
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fungsi untuk menangani input file 
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const data = new FormData();

    data.append("judul", formData.judul);
    data.append("penulis", formData.penulis);
    data.append("tahun_terbit", formData.tahun_terbit);
    data.append("deskripsi", formData.deskripsi);
    data.append("kategori", formData.kategori);
    data.append("bahasa", formData.bahasa);
    data.append("harga", formData.harga);
    data.append("stok", formData.stok);

    if (selectedFile) {
      data.append("gambar_file", selectedFile, selectedFile.name);
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/buku",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `Buku "${formData.judul}" berhasil ditambahkan! (ID: ${res.data.bookId})`
      );

      // Kosongkan form setelah sukses
      setFormData({
        judul: "",
        penulis: "",
        tahun_terbit: "",
        deskripsi: "",
        kategori: "",
        harga: "",
        stok: "",
        bahasa: "",
      });
      setSelectedFile(null); // Kosongkan file
      e.target.reset(); // Mereset form (termasuk input file)
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      <h3 style={{ textAlign: "center", marginBottom: "2rem" }}>
        Halaman Admin: Tambah Buku
      </h3>

      <form
        onSubmit={handleSubmit}
        className="form-box"
        style={{ width: "100%", boxShadow: "none", border: "none", padding: 0 }}
      >
        <div className="form-group">
          <label>Judul Buku*</label>
          <input
            type="text"
            name="judul"
            value={formData.judul}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Penulis*</label>
          <input
            type="text"
            name="penulis"
            value={formData.penulis}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Harga (angka, misal: 150000)*</label>
          <input
            type="number"
            name="harga"
            value={formData.harga}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Stok (angka)*</label>
          <input
            type="number"
            name="stok"
            value={formData.stok}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Tahun Terbit (angka)</label>
          <input
            type="number"
            name="tahun_terbit"
            value={formData.tahun_terbit}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Kategori</label>
          <input
            type="text"
            name="kategori"
            value={formData.kategori}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Bahasa</label>
          <input
            type="text"
            name="bahasa"
            placeholder="Contoh: English"
            value={formData.bahasa}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Upload Gambar</label>
          <input
            type="file" 
            name="gambar_file"
            onChange={handleFileChange}
            style={{ border: "none", padding: "10px 0" }}
          />
        </div>

        <div className="form-group">
          <label>Deskripsi</label>
          <textarea
            name="deskripsi"
            value={formData.deskripsi}
            onChange={handleChange}
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "1rem",
              fontSize: "13px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          ></textarea>
        </div>

        <button type="submit" className="form-button">
          Tambah Buku
        </button>
      </form>

      {/* Tampilkan pesan sukses atau error */}
      {message && (
        <p style={{ marginTop: "1rem", textAlign: "center" }}>{message}</p>
      )}
    </div>
  );
};

export default AdminPage;
