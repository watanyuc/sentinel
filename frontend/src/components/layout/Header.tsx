import { Shield, Wifi, WifiOff, LogOut, User, Settings, Users, ChevronDown, BarChart3, History, FileText, Sun, Moon, Globe, CalendarDays } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { DualClock } from '../clocks/DualClock';
import { useAccountStore } from '../../stores/accountStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useTranslation } from '../../i18n/useTranslation';
import { savePreferences } from '../../services/api';

export const Header = () => {
  const wsConnected = useAccountStore(s => s.wsConnected);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const currentPage = useUIStore(s => s.currentPage);
  const setCurrentPage = useUIStore(s => s.setCurrentPage);
  const theme = useUIStore(s => s.theme);
  const setTheme = useUIStore(s => s.setTheme);
  const language = useUIStore(s => s.language);
  const setLanguage = useUIStore(s => s.setLanguage);
  const t = useTranslation();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    savePreferences({ theme: next }).catch(() => {});
  };

  const toggleLanguage = () => {
    const next = language === 'en' ? 'th' : 'en';
    setLanguage(next);
    savePreferences({ language: next }).catch(() => {});
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary border-b border-gray-800 backdrop-blur-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Logo — click to go to dashboard */}
          <button onClick={() => setCurrentPage('dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-bold text-white tracking-wider">{t('app.title')}</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">{t('app.subtitle')}</p>
            </div>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { page: 'dashboard' as const,     label: t('nav.dashboard'), icon: Shield },
              { page: 'analytics' as const,     label: t('nav.analytics'), icon: BarChart3 },
              { page: 'trade-history' as const, label: t('nav.trades'),    icon: History },
              { page: 'calendar' as const,      label: t('nav.calendar'),  icon: CalendarDays },
            ].map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-accent-blue/15 text-accent-blue'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>

          {/* Center: DualClock */}
          <div className="hidden lg:flex flex-1 justify-center">
            <DualClock />
          </div>

          {/* Right: Theme + Language + WS Status + User Menu */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              title={language === 'en' ? 'Switch to Thai' : 'Switch to English'}
            >
              <Globe size={14} />
              <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'TH'}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* WS Status */}
            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
              wsConnected
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-danger/30 bg-danger/10 text-danger'
            }`}>
              {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span className="hidden sm:inline">{wsConnected ? t('ws.connected') : t('ws.disconnected')}</span>
            </div>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800 border border-gray-800">
                  <div className="w-6 h-6 bg-accent-blue/20 rounded-full flex items-center justify-center">
                    <User size={12} className="text-accent-blue" />
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{user?.name || user?.email}</span>
                  <ChevronDown size={12} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[200px] bg-bg-secondary border border-gray-700 rounded-lg shadow-xl py-1 z-[100]"
                  sideOffset={8}
                  align="end"
                >
                  <div className="px-3 py-2 border-b border-gray-800">
                    <p className="text-sm text-white font-medium truncate">{user?.name || 'No name'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      user?.role === 'admin' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-gray-700 text-gray-400'
                    }`}>{user?.role}</span>
                  </div>

                  {/* Mobile nav links (hidden on md+) */}
                  <div className="md:hidden">
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                      onSelect={() => setCurrentPage('dashboard')}
                    >
                      <Shield size={14} />
                      {t('nav.dashboard')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                      onSelect={() => setCurrentPage('analytics')}
                    >
                      <BarChart3 size={14} />
                      {t('nav.analytics')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                      onSelect={() => setCurrentPage('trade-history')}
                    >
                      <History size={14} />
                      {t('nav.trades')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                      onSelect={() => setCurrentPage('calendar')}
                    >
                      <CalendarDays size={14} />
                      {t('nav.calendar')}
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-gray-800 my-1" />
                  </div>

                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                    onSelect={() => setCurrentPage('profile')}
                  >
                    <Settings size={14} />
                    {t('nav.profile')}
                  </DropdownMenu.Item>

                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                        onSelect={() => setCurrentPage('admin')}
                      >
                        <Users size={14} />
                        {t('nav.admin')}
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                        onSelect={() => setCurrentPage('audit')}
                      >
                        <FileText size={14} />
                        {t('nav.audit')}
                      </DropdownMenu.Item>
                    </>
                  )}

                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer outline-none"
                    onSelect={() => setCurrentPage('privacy')}
                  >
                    <Shield size={14} />
                    Privacy & PDPA
                  </DropdownMenu.Item>

                  <DropdownMenu.Separator className="h-px bg-gray-800 my-1" />

                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-gray-800 cursor-pointer outline-none"
                    onSelect={logout}
                  >
                    <LogOut size={14} />
                    {t('auth.logout')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </header>
  );
};
