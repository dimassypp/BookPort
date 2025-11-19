// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        try {
          // Set token di header default axios
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Ambil data profil user
          const res = await axios.get('http://localhost:5000/api/profile');
          setUser(res.data);
          setToken(storedToken);
        } catch (err) {
          console.error('Error loading user:', err);
          // Token tidak valid, hapus
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/login', { 
        email, 
        password 
      });
      
      const { token: newToken, user: userData } = res.data;
      
      // Simpan token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      // Set header untuk request berikutnya
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return res.data;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;