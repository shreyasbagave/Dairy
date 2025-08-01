import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import ViewFarmerRecords from './pages/ViewFarmerRecords';
import AddMilkEntryForm from './pages/AddMilkEntryForm';
import FarmerManagement from './pages/FarmerManagement';
import MilkLogging from './pages/MilkLogging';
import MilkLogView from './pages/MilkLogView';
import DashboardHome from './components/DashboardHome';
import ResetPassword from './pages/ResetPassword';
import ProfilePage from './pages/ProfilePage';

function App() {
  useEffect(() => {
    // Add responsive meta tag if not already present
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden'
    }}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="farmers" element={<FarmerManagement />} />
          <Route path="milk-logging" element={<MilkLogging />} />
          <Route path="milk-logs" element={<MilkLogView />} />
          <Route path="farmer-records" element={<ViewFarmerRecords />} />
        </Route>
        <Route path="/admin/add-milk-entry" element={<AddMilkEntryForm />} />
        <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
      </Routes>
    </div>
  );
}

export default App; 