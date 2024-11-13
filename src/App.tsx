import React from 'react';
import Navbar from './components/Navbar';
import Calendar from './components/Calendar';
import UpcomingPaydays from './components/UpcomingPaydays';
import VacationPlanner from './components/VacationPlanner';
import DebtSnowball from './components/DebtSnowball';
import Subscriptions from './components/Subscriptions';
import Admin from './components/Admin';
import SavingsTracker from './components/SavingsTracker';
import Support from './components/Support';
import Resources from './components/Resources';
import Trophies from './components/Trophies';
import LandingPage from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [currentView, setCurrentView] = React.useState('calendar');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  const renderView = () => {
    // Redirect non-admin users if they try to access admin page
    if (currentView === 'admin' && !user?.isAdmin) {
      setCurrentView('calendar');
      return <Calendar />;
    }

    switch (currentView) {
      case 'calendar':
        return <Calendar />;
      case 'upcoming-paydays':
        return <UpcomingPaydays />;
      case 'savings':
        return <SavingsTracker />;
      case 'vacation':
        return <VacationPlanner />;
      case 'debt':
        return <DebtSnowball />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'trophies':
        return <Trophies />;
      case 'support':
        return <Support />;
      case 'resources':
        return <Resources />;
      case 'admin':
        return <Admin />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ErrorBoundary>
        <Navbar onViewChange={setCurrentView} currentView={currentView} />
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">SmartBudget</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            {renderView()}
          </ErrorBoundary>
        </main>
      </ErrorBoundary>
    </div>
  );
}