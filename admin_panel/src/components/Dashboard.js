import React from 'react';

const Dashboard = () => {
  return React.createElement('div', { className: 'dashboard' },
    React.createElement('h1', null, 'Admin Dashboard'),
    React.createElement('p', null, 'Welcome, Administrator! You have limited access.'),
    React.createElement('div', { className: 'dashboard-content' },
      React.createElement('div', { className: 'card' },
        React.createElement('h3', null, 'Content Management'),
        React.createElement('p', null, 'Manage website content')
      ),
      React.createElement('div', { className: 'card' },
        React.createElement('h3', null, 'Analytics'),
        React.createElement('p', null, 'View site statistics')
      ),
      React.createElement('div', { className: 'card' },
        React.createElement('h3', null, 'User Reports'),
        React.createElement('p', null, 'Review user activity')
      )
    )
  );
};

export default Dashboard;