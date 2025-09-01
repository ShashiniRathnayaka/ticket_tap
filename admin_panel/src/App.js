import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './components/AdminLogin';
import AdminSignup from './components/AdminSignup';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import Layout from './components/Layout';

// Protected Route Component with Layout
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Redirect to="/login" />;
};

// Admin type checking component
const AdminRouter = () => {
  const { user } = useAuth();
  
  if (user && user.role === 'SUPERADMIN') {
    return <SuperAdminDashboard />;
  } else if (user) {
    // This should not happen as regular admins are blocked at login
    return <div>Access denied. Only super administrators are allowed.</div>;
  } else {
    return <Redirect to="/login" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          <Route path="/login" component={AdminLogin} />
          <Route path="/signup" component={AdminSignup} />
          <Route 
            path="/dashboard" 
            render={() => (
              <ProtectedRoute>
                <AdminRouter />
              </ProtectedRoute>
            )} 
          />
          <Route 
            exact 
            path="/" 
            render={() => <Redirect to="/dashboard" />} 
          />
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;