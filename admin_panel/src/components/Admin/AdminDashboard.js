// import React, { useState, useEffect } from 'react';
// import DriveManagement from './DriverManagement';
// import RouteManagement from './RouteManagement';
// import BusManagement from './BusManagement';
// import '../Dashboard.css';

// const AdminDashboard = () => {
//   const [activeTab, setActiveTab] = useState('overview');
//   const [loading, setLoading] = useState(true);
//   // const [error, setError] = useState('');

//   useEffect(() => {
//     // Simulate loading data for the overview
//     const timer = setTimeout(() => {
//       setLoading(false);
//     }, 1000);
    
//     return () => clearTimeout(timer);
//   }, [activeTab]);

//   const renderContent = () => {
//     if (loading) {
//       return <div className="loading">Loading...</div>;
//     }

//     switch (activeTab) {
//       case 'overview':
//         return (
//           <div className="overview-grid">
//             <div className="card">
//               <h3>System Overview</h3>
//               <p><b>Active Drives:</b> 15</p>
//               <p><b>Total Routes:</b> 8</p>
//               <p><b>Available Buses:</b> 12</p>
//               <p>
//                 <b>System Status:</b>{" "}
//                 <span style={{ color: '#27ae60' }}>Online</span>
//               </p>
//             </div>

//             <div className="card">
//               <h3>Quick Actions</h3>
//               <div className="action-buttons">
//                 <button onClick={() => setActiveTab('drives')}>Manage Drives</button>
//                 <button onClick={() => setActiveTab('routes')}>Manage Routes</button>
//                 <button onClick={() => setActiveTab('buses')}>Manage Buses</button>
//               </div>
//             </div>
//           </div>
//         );

//       case 'drives':
//         return <DriveManagement />;

//       case 'routes':
//         return <RouteManagement />;

//       case 'buses':
//         return <BusManagement />;

//       default:
//         return <p>Select a tab</p>;
//     }
//   };

//   return (
//     <div className="dashboard-layout">
//       <aside className="sidebar">
//         <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? "active" : ""}>Dashboard Overview</button>
//         <button onClick={() => setActiveTab('drives')} className={activeTab === 'drives' ? "active" : ""}>Drive Management</button>
//         <button onClick={() => setActiveTab('routes')} className={activeTab === 'routes' ? "active" : ""}>Route Management</button>
//         <button onClick={() => setActiveTab('buses')} className={activeTab === 'buses' ? "active" : ""}>Bus Management</button>
//       </aside>

//       <main className="main-content">
//         {renderContent()}
//       </main>
//     </div>
//   );
// };

// export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import DriveManagement from './DriverManagement';
import RouteManagement from './RouteManagement';
import BusManagement from './BusManagement';
import ScheduleManagement from './ScheduleManagement'; // Import the new component
import '../Dashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');

  useEffect(() => {
    // Simulate loading data for the overview
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  const renderContent = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-grid">
            <div className="card">
              <h3>System Overview</h3>
              <p><b>Active Drives:</b> 15</p>
              <p><b>Total Routes:</b> 8</p>
              <p><b>Available Buses:</b> 12</p>
              <p><b>Scheduled Trips:</b> 25</p>
              <p>
                <b>System Status:</b>{" "}
                <span style={{ color: '#27ae60' }}>Online</span>
              </p>
            </div>

            <div className="card">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => setActiveTab('drives')}>Manage Drives</button>
                <button onClick={() => setActiveTab('routes')}>Manage Routes</button>
                <button onClick={() => setActiveTab('buses')}>Manage Buses</button>
                <button onClick={() => setActiveTab('schedules')}>Manage Schedules</button>
              </div>
            </div>
          </div>
        );

      case 'drives':
        return <DriveManagement />;

      case 'routes':
        return <RouteManagement />;

      case 'buses':
        return <BusManagement />;

      case 'schedules':
        return <ScheduleManagement />;

      default:
        return <p>Select a tab</p>;
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? "active" : ""}>Dashboard Overview</button>
        <button onClick={() => setActiveTab('drives')} className={activeTab === 'drives' ? "active" : ""}>Drive Management</button>
        <button onClick={() => setActiveTab('routes')} className={activeTab === 'routes' ? "active" : ""}>Route Management</button>
        <button onClick={() => setActiveTab('buses')} className={activeTab === 'buses' ? "active" : ""}>Bus Management</button>
        <button onClick={() => setActiveTab('schedules')} className={activeTab === 'schedules' ? "active" : ""}>Schedule Management</button>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;