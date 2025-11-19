import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user && user.role === 'admin') {
    return children;
  }

  // Jika tidak login, lempar ke login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Jika login tapi bukan admin, lempar ke Halaman Utama
  return <Navigate to="/" state={{ from: location }} replace />;
};

export default AdminRoute;