import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './components/AdminLogin';
import AdminSignup from './components/AdminSignup';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import Layout from './components/Layout';

// Protected Route Component with Layout
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Redirect to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Switch>
          {/* Auth routes */}
          <Route path="/login" component={AdminLogin} />
          <Route path="/signup" component={AdminSignup} />

          {/* SuperAdmin Dashboard */}
          <Route
            path="/super-admin-dashboard"
            render={() => (
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            )}
          />

          {/* Admin Dashboard */}
          <Route
            path="/admin-dashboard"
            render={() => (
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            )}
          />

          {/* Default redirect */}
          <Route exact path="/" render={() => <Redirect to="/login" />} />
        </Switch>
      </Router>
    </AuthProvider>
  );
}

export default App;
