import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './components/AdminLogin';
import AdminSignup from './components/AdminSignup';
// import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import Layout from './components/Layout';

// Protected Route Component with Layout
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? React.createElement(Layout, null, children) : React.createElement(Redirect, { to: "/login" });
};

// Admin type checking component
const AdminRouter = () => {
  const { user } = useAuth();
  
  if (user && user.role === 'SUPERADMIN') {
    return React.createElement(SuperAdminDashboard);
  } else if (user) {
    // This should not happen as regular admins are blocked at login
    return React.createElement('div', null, 
      'Access denied. Only super administrators are allowed.'
    );
  } else {
    return React.createElement(Redirect, { to: "/login" });
  }
};

function App() {
  return React.createElement(AuthProvider, null,
    React.createElement(Router, null,
      React.createElement(Switch, null,
        React.createElement(Route, {
          path: "/login",
          component: AdminLogin
        }),
        React.createElement(Route, {
          path: "/signup",
          component: AdminSignup
        }),
        React.createElement(Route, {
          path: "/dashboard",
          render: () => React.createElement(ProtectedRoute, null,
            React.createElement(AdminRouter)
          )
        }),
        React.createElement(Route, {
          exact: true,
          path: "/",
          render: () => React.createElement(Redirect, { to: "/dashboard" })
        })
      )
    )
  );
}

export default App;