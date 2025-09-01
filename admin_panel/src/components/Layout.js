import React from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    history.push('/login', { message: 'Logged out successfully.' });
  };

  return React.createElement('div', { className: 'layout' },
    React.createElement('header', { className: 'header' },
      React.createElement('div', { className: 'header-content' },
        React.createElement('h1', null, 'Admin Panel'),
        user && React.createElement('div', { className: 'user-info' },
          React.createElement('span', null, 'Welcome, ', user.name),
          React.createElement('span', { className: 'user-role' }, '(', user.role, ')'),
          React.createElement('button', { 
            onClick: handleLogout, 
            className: 'logout-btn' 
          }, 'Logout')
        )
      )
    ),
    React.createElement('main', { className: 'main-content' }, children)
  );
};

export default Layout;