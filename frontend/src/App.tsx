import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useWebSocket } from './hooks/useWebSocket';
import { getProfile } from './services/api';
import { LoginPage } from './components/auth/LoginPage';
import { Layout } from './components/layout/Layout';
import { TradingViewChart } from './components/chart/TradingViewChart';

import { OverviewTabs } from './components/overview/OverviewTabs';
import { BotList } from './components/bots/BotList';
import { ProfileSettings } from './components/settings/ProfileSettings';
import { UserManagement } from './components/admin/UserManagement';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { TradeHistoryPage } from './components/trades/TradeHistoryPage';
import { PrivacyPolicy } from './components/privacy/PrivacyPolicy';
import { EconomicCalendar } from './components/calendar/EconomicCalendar';
import { ToastContainer } from './components/ui/Toast';

/** Sync theme class on <html> element */
const useThemeSync = () => {
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'hud');
    if (theme === 'light') root.classList.add('light');
    else if (theme === 'hud') root.classList.add('dark', 'hud');
    else root.classList.add('dark');
  }, [theme]);
};

const Dashboard = () => {
  const token = useAuthStore(s => s.token);
  const currentPage = useUIStore(s => s.currentPage);
  useWebSocket(token);
  useThemeSync();

  return (
    <Layout>
      {currentPage === 'dashboard' && (
        <>
          <TradingViewChart />
          <OverviewTabs />
          <BotList />
        </>
      )}
      {currentPage === 'analytics' && <AnalyticsPage />}
      {currentPage === 'trade-history' && <TradeHistoryPage />}
      {currentPage === 'profile' && <ProfileSettings />}
      {currentPage === 'admin' && <UserManagement />}
      {currentPage === 'audit' && <AuditLogViewer />}
      {currentPage === 'privacy' && <PrivacyPolicy />}
      {currentPage === 'calendar' && <EconomicCalendar />}
      <ToastContainer />
    </Layout>
  );
};

function App() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);
  const [ready, setReady] = useState(false);

  // Validate persisted token on startup
  useEffect(() => {
    if (!isAuthenticated) {
      setReady(true);
      return;
    }
    getProfile()
      .then(() => setReady(true))
      .catch(() => {
        logout();
        setReady(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  if (!isAuthenticated) return <LoginPage />;
  return <Dashboard />;
}

export default App;
