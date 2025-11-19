import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const originalPadding = document.body.style.paddingTop;
    document.body.style.paddingTop = '0px';
    return () => {
      document.body.style.paddingTop = originalPadding || '';
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registrasi gagal');
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Illustration */}
      <div className="login-left">
        <div className="login-illustration">
          <img 
            src="/images/RegisterLeft.png" 
            alt="Books Illustration"
          />
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="login-right">
        <button className="login-close" onClick={() => navigate('/')}>×</button>
        
        <div className="login-box">
          <h1 className="login-title">Register To BookPort</h1>

          {error && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1rem', 
              backgroundColor: '#fee', 
              color: '#c33',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="social-login-buttons">
            <button className="social-button">
              <svg className="social-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            <button className="social-button">
              <img 
                src="/images/email.png" 
                alt="Email" 
                className="social-icon" 
                style={{ width: '20px', height: '20px' }} 
              />
              Sign up with Email
            </button>
          </div>

          <div className="divider">OR</div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name} 
                onChange={handleChange}
                placeholder="" 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleChange}
                placeholder="" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password} 
                onChange={handleChange}
                placeholder="" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword} 
                onChange={handleChange}
                placeholder="" 
                required 
              />
            </div>

            <button type="submit" className="signin-button">
              Register
            </button>

            <p style={{ 
              textAlign: 'center', 
              marginTop: '1rem', 
              fontSize: '14px', 
              color: '#666'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0066cc', fontWeight: '600' }}>
                Sign In
              </Link>
            </p>
          </form>
        </div>

        <div className="terms-link">
          <Link to="/terms">BookPort Terms & Conditions</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;