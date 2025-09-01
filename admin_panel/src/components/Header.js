// src/components/Header.js
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1>Admin Portal</h1>
        <nav className="header-nav">
          {user ? (
            <>
              <span className="header-user">Welcome, {user.email}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <button 
              onClick={() => history.push('/login')} 
              className="login-btn"
            >
              Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;