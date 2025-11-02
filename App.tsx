import React, { useState, useEffect } from 'react';
import { Studio } from './components/Studio';
import { LoadingScreen } from './components/LoadingScreen';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import CreditStore from './components/CreditStore';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';

type View = 'landing' | 'studio' | 'admin_login' | 'admin_dashboard' | 'credit_store';

function App() {
  const [initializing, setInitializing] = useState(true);
  const [currentView, setCurrentView] = useState<View>('landing');
  const { isAdminLoggedIn, login, logout } = useAuth();
  const { user, loading: userLoading } = useUserData();

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 2000); 
    return () => clearTimeout(timer);
  }, []);

  const navigateTo = (view: View) => {
    // If trying to access admin dashboard without being logged in, redirect to login
    if (view === 'admin_dashboard' && !isAdminLoggedIn) {
        setCurrentView('admin_login');
        return;
    }
    setCurrentView(view);
  };
  
  const handleLogin = (password: string) => {
      const success = login(password);
      if (success) {
          navigateTo('admin_dashboard');
      }
      return success;
  }
  
  const handleLogout = () => {
      logout();
      navigateTo('landing');
  }

  if (initializing || userLoading) {
    return <LoadingScreen />;
  }
  
  const renderView = () => {
    switch (currentView) {
      case 'studio':
        return <Studio onNavigate={navigateTo} />;
      case 'admin_login':
        return <AdminLogin onLogin={handleLogin} />;
      case 'admin_dashboard':
        // Protected view
        return isAdminLoggedIn ? <AdminDashboard onLogout={handleLogout} /> : <AdminLogin onLogin={handleLogin} />;
      case 'credit_store':
          return <CreditStore onNavigate={navigateTo} user={user} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };
  
  return (
    <div className="bg-grid min-h-screen bg-[#050510] text-gray-200 font-sans">
      {renderView()}
    </div>
  );
}

export default App;
