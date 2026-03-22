import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Hero from './components/sections/Hero';
import LogoCarousel from './components/LogoCarousel';
import About from './components/sections/About';
import HowItWorks from './components/sections/HowItWorks';
import Clients from './components/sections/Clients';
import Pricing from './components/sections/Pricing';
import Contact from './components/sections/Contact';
import Footer from './components/common/Footer';
import WhatsAppFloat from './components/common/WhatsAppFloat';
import MapButton from './components/map/MapButton';
import StationMap from './components/map/StationMap';
import AuthModal from './components/auth/AuthModal';
import Dashboard from './components/dashboard/Dashboard';
import ResetPassword from './components/auth/ResetPassword';
import PWAInstall from './components/pwa/PWAInstall';
import './App.css';
import './AuthDashboard.css';
import './Charging.css';
import './Mobile.css';
import './ResetPassword.css';

// Home Page Component
function HomePage() {
  const [showMap, setShowMap] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="app">
      <Navbar onLoginClick={() => setShowLogin(true)} />
      <Hero />
      <LogoCarousel />
      <About />
      <HowItWorks />
      <Clients />
      <Pricing />
      <Contact />
      <Footer />
      
      <PWAInstall />
      <WhatsAppFloat phoneNumber="923227190119" />
      <MapButton onClick={() => setShowMap(true)} />

      {showMap && <StationMap onClose={() => setShowMap(false)} />}
      {showLogin && <AuthModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// Dashboard Page Component
function DashboardPage() {
  const { user } = useAuth();
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <Dashboard />;
}

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}