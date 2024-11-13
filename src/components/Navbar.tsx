import React from 'react';
import { Calendar, DollarSign, Plane, Snowflake, CreditCard, Menu, X, Shield, PiggyBank, LogOut, HelpCircle, BookOpen, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../lib/firebase';

interface NavbarProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

export default function Navbar({ onViewChange, currentView }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { icon: Calendar, label: 'Calendar', id: 'calendar' },
    { icon: DollarSign, label: 'Upcoming Paydays', id: 'upcoming-paydays' },
    { icon: PiggyBank, label: 'Savings', id: 'savings' },
    { icon: Plane, label: 'Vacation Planning', id: 'vacation' },
    { icon: Snowflake, label: 'Debt Snowball', id: 'debt' },
    { icon: CreditCard, label: 'Subscriptions', id: 'subscriptions' },
    { icon: Trophy, label: 'Achievements', id: 'trophies' },
    { icon: BookOpen, label: 'Resources', id: 'resources' },
    { icon: HelpCircle, label: 'Support', id: 'support' },
    // Only show Admin menu item to admin users
    ...(user?.isAdmin ? [{ icon: Shield, label: 'Admin', id: 'admin' }] : [])
  ];

  return (
    <nav className="bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`${
                      currentView === item.id
                        ? 'bg-indigo-700 text-white'
                        : 'text-indigo-100 hover:bg-indigo-500'
                    } px-3 py-2 rounded-md text-sm font-medium flex items-center`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="text-indigo-100 hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
            <div className="md:hidden ml-4">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:bg-indigo-500 focus:outline-none"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setIsOpen(false);
                }}
                className={`${
                  currentView === item.id
                    ? 'bg-indigo-700 text-white'
                    : 'text-indigo-100 hover:bg-indigo-500'
                } block px-3 py-2 rounded-md text-base font-medium flex items-center w-full`}
              >
                <item.icon className="h-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="text-indigo-100 hover:bg-indigo-500 block px-3 py-2 rounded-md text-base font-medium flex items-center w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}