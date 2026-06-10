
import React, { lazy, Suspense, Component, ReactNode } from 'react';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import Header from './components/Header';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationToast from './components/NotificationToast';
import OfflineIndicator from './components/OfflineIndicator';
import { ThemeProvider } from './contexts/ThemeContext';
import LoadingSkeleton from './components/LoadingSkeleton';
import AppLoader from './components/AppLoader';
import { UserRole } from './types';
import './styles/student-dashboard.css';

const AuthScreen = lazy(() => import('./views/AuthScreen').then(module => ({ default: module.AuthScreen })));
const StudentDashboard = lazy(() => import('./views/StudentDashboard'));
const DriverDashboard = lazy(() => import('./views/DriverDashboard'));
const DriverOnboarding = lazy(() => import('./views/DriverOnboarding'));
const ProfileScreen = lazy(() => import('./views/ProfileScreen'));
const PaymentScreen = lazy(() => import('./views/PaymentScreen'));
const SchedulerScreen = lazy(() => import('./views/SchedulerScreen'));
const HeatmapView = lazy(() => import('./views/HeatmapView'));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div className="app-loader">
                    <div className="app-loader-card">
                        <i className="fas fa-exclamation-circle app-loader-icon" style={{ color: 'var(--danger)' }}></i>
                        <h1 className="app-loader-title">Something went wrong</h1>
                        <p className="app-loader-message">{this.state.error.message}</p>
                        <button type="button" className="mbu-btn-primary mt-3" style={{ maxWidth: 200, margin: '1rem auto 0' }} onClick={() => window.location.reload()}>
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const AppContent: React.FC = () => {
  const { authUser, student, driver, loading, view } = useFirebase();

  if (loading) {
    return <AppLoader message="Starting MBUGO..." />;
  }

  if (!authUser) {
    return <Suspense fallback={<AppLoader message="Loading sign in..." />}><AuthScreen /></Suspense>;
  }

  const role = authUser.role;
  const userLoaded = (role === UserRole.STUDENT && student) || (role === UserRole.DRIVER && driver);

  if (role === UserRole.DRIVER && driver && !driver.hasCompletedOnboarding) {
    return <Suspense fallback={<LoadingSkeleton />}><DriverOnboarding /></Suspense>;
  }

  if (role === UserRole.STUDENT && userLoaded) {
    return (
      <Suspense fallback={<AppLoader message="Loading MBUGO..." />}>
        <StudentDashboard />
      </Suspense>
    );
  }

  if (role === UserRole.DRIVER && userLoaded) {
    return (
      <Suspense fallback={<AppLoader message="Loading driver dashboard..." />}>
        <DriverDashboard />
      </Suspense>
    );
  }

  const renderView = () => {
    switch(view) {
      case 'profile':
        return <ProfileScreen />;
      case 'wallet':
        return <PaymentScreen />;
      case 'scheduler':
        return <SchedulerScreen />;
      case 'heatmap':
        return <HeatmapView />;
      case 'dashboard':
      default:
        return <AppLoader message={`Loading ${role} dashboard...`} />;
    }
  };

  return (
    <>
      <Header />
      <main className="main-content">
        <div className="container">
          <Suspense fallback={<LoadingSkeleton />}>
            {renderView()}
          </Suspense>
        </div>
      </main>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <FirebaseProvider>
            <OfflineIndicator />
            <AppContent />
            <NotificationToast />
          </FirebaseProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
