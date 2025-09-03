import React, { useState } from 'react';
import { useHistory, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AuthForms.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const history = useHistory();
  const location = useLocation();

  // Get logout success message if present
  const successMessage = location.state && location.state.message;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post("http://localhost:5000/auth/login", formData);
      
      // Save token and user data
      localStorage.setItem("token", res.data.accessToken);
      console.log(res.data);
      
      // Extract user data from response (adjust according to your API response)
      const userData = {
        email: formData.email,
        name: res.data.user.name,
        role: res.data.user.role || 'ADMIN', // Assuming API returns role
        token: res.data.accessToken
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      login(userData);
      
      // Redirect based on role
      // Redirect based on role
      if (userData.role === 'SUPERADMIN') {
        history.push('/super-admin-dashboard');
      } else if (userData.role === 'ADMIN') {
        history.push('/admin-dashboard');
      } else {
        setError('Access denied. Only administrators are allowed.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        login(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        
        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;