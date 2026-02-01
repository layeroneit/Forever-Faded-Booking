import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Placeholder from './components/Placeholder';
import Book from './pages/Book';
import Appointments from './pages/Appointments';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Locations from './pages/Locations';
import Services from './pages/Services';
import Clients from './pages/Clients';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import DailyCuts from './pages/DailyCuts';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="book" element={<Book />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="profile" element={<Profile />} />
          <Route path="locations" element={<Locations />} />
          <Route path="services" element={<Services />} />
          <Route path="clients" element={<Clients />} />
          <Route path="staff" element={<Staff />} />
          <Route path="settings" element={<Settings />} />
          <Route path="daily-cuts" element={<DailyCuts />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="schedule" element={<Placeholder title="Schedule" />} />
          <Route path="inventory" element={<Placeholder title="Inventory" />} />
          <Route path="payroll" element={<Placeholder title="Payroll" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
