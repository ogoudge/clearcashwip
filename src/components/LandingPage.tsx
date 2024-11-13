import React from 'react';
import { DollarSign, PiggyBank, Calendar, Shield, LogIn, HelpCircle, Trophy, CreditCard, Plane, Snowflake, BookOpen } from 'lucide-react';
import { signIn, createUser } from '../lib/firebase';

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(true);
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });
  const [error, setError] = React.useState<string | null>(null);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await createUser(formData.email, formData.password);
      }
    } catch (err: any) {
      const errorCode = err?.code || 'unknown';
      setError(getErrorMessage(errorCode));
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '' });
    setError(null);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700">
      {/* Navigation */}
      <nav className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">SmartBudget</span>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            Take Control of Your Financial Future
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-indigo-100 sm:text-lg md:mt-5 md:text-xl">
            Smart budgeting, automated savings, and intelligent bill management all in one place
          </p>
          <div className="mt-8">
            <button
              onClick={() => {
                setIsLogin(false);
                setShowAuthModal(true);
              }}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 md:text-lg"
            >
              Get Started
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <Calendar className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Smart Calendar</h3>
            <p className="mt-2 text-indigo-100">
              Track bills, income, and expenses with our intelligent financial calendar
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <PiggyBank className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Automated Savings</h3>
            <p className="mt-2 text-indigo-100">
              Set savings goals and automatically allocate your income
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <Snowflake className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Debt Snowball</h3>
            <p className="mt-2 text-indigo-100">
              Strategically eliminate debt with our snowball calculator
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <CreditCard className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Subscription Tracker</h3>
            <p className="mt-2 text-indigo-100">
              Monitor and manage your recurring subscriptions
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <Plane className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Vacation Planning</h3>
            <p className="mt-2 text-indigo-100">
              Plan and save for your dream vacations with automated savings
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <Trophy className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
            <p className="mt-2 text-indigo-100">
              Earn trophies as you reach your financial milestones
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <BookOpen className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Resources</h3>
            <p className="mt-2 text-indigo-100">
              Access curated financial tools and resources to boost your finances
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <Shield className="h-8 w-8 text-indigo-200 mb-4" />
            <h3 className="text-lg font-semibold text-white">Secure & Private</h3>
            <p className="mt-2 text-indigo-100">
              We don't collect any personal or banking information
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                {isLogin ? 'Sign in to your account' : 'Create a new account'}
              </h2>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {!isLogin && (
                  <p className="mt-1 text-sm text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isLogin ? 'Sign in' : 'Create account'}
                </button>
              </div>

              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </button>
              </div>

              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    resetForm();
                  }}
                  className="font-medium text-gray-600 hover:text-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}