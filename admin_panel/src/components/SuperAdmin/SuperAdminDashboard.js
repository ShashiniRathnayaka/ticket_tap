import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserManagement from './UserManagement';
import '../Dashboard.css';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-grid">
            <div className="card">
              <h3>System Overview</h3>
              <p><b>Total Users:</b> 150</p>
              <p><b>Pending Verifications:</b> 5</p>
              <p>
                <b>System Status:</b>{" "}
                <span style={{ color: '#27ae60' }}>Online</span>
              </p>
            </div>

            <div className="card">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('users')}>Manage Users</button>
                <button>View Reports</button>
                <button onClick={() => setActiveTab('settings')}>System Settings</button>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <UserManagement users={users} loading={loading} error={error} />
        );

      case 'settings':
        return (
          <div>
            <h2>System Settings</h2>
            <p>System configuration options will be available here.</p>
          </div>
        );

      default:
        return <p>Select a tab</p>;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar only (Header already comes from Layout.js) */}
      <aside className="sidebar">
        <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? "active" : ""}>Dashboard Overview</button>
        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? "active" : ""}>User Management</button>
        <button onClick={() => setActiveTab('settings')} className={activeTab === 'settings' ? "active" : ""}>System Settings</button>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
