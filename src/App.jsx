import React, { useState } from 'react';
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
import './App.css';
import './AuthDashboard.css';

function AppContent() {
  const [showMap, setShowMap] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user } = useAuth();

  // If user is logged in and on dashboard route, show dashboard
  if (user && window.location.pathname === '/dashboard') {
    return <Dashboard />;
  }

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

      <WhatsAppFloat phoneNumber="923227190119" />
      <MapButton onClick={() => setShowMap(true)} />

      {showMap && <StationMap onClose={() => setShowMap(false)} />}
      {showLogin && <AuthModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
