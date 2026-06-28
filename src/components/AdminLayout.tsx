import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/context/AuthContext';

const SETTINGS_API = 'https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a';

const navItems: { to: string; label: string; icon: string; soon?: boolean }[] = [
  { to: '/', label: 'Настройки клуба', icon: 'Settings' },
  { to: '/tables', label: 'Бронирование', icon: 'CalendarCheck' },
  { to: '/statistics', label: 'Статистика', icon: 'BarChart3' },
  { to: '/table-settings', label: 'Настройки столов', icon: 'Grid3x3' },
  { to: '/hall-map', label: 'Схема зала', icon: 'Map' },
  { to: '/documents', label: 'Документы', icon: 'FileStack' },
  { to: '/integrations', label: 'Интеграции', icon: 'Plug', soon: true },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const AdminLayout = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${SETTINGS_API}?resource=balance`)
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? 0))
      .catch(() => {});
  }, []);

  const fmtBalance = (v: number) =>
    v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-72 felt-texture text-primary-foreground p-6 lg:p-8 flex lg:flex-col gap-4 lg:gap-6 items-center lg:items-stretch justify-between lg:justify-start">

        {/* Лого */}
        <div className="flex flex-col gap-1">
          <img
            src="https://cdn.poehali.dev/projects/ebab8bd9-031b-48f4-a7d3-fccb5d4b6d46/bucket/3cafc0df-c8ed-447c-9221-2af5234d84c1.png"
            alt="SmartBilliard"
            className="hidden lg:block w-full max-w-[200px] object-contain"
          />
          <div className="lg:hidden w-11 h-11 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center shrink-0">
            <Icon name="CircleDot" size={24} />
          </div>
          <p className="hidden lg:block text-xs text-primary-foreground/50 mt-1">Панель администратора</p>
        </div>

        {/* Баланс */}
        <div className="hidden lg:block rounded-2xl bg-primary-foreground/10 border border-primary-foreground/15 px-4 py-3">
          <p className="text-[11px] text-primary-foreground/50 uppercase tracking-widest mb-1 font-medium flex items-center gap-1.5">
            <Icon name="Smartphone" size={11} /> Онлайн сегодня
          </p>
          <p className="text-2xl font-bold tracking-tight">
            {balance === null ? (
              <span className="opacity-40 text-base">загрузка…</span>
            ) : (
              <>{fmtBalance(balance)} ₽</>
            )}
          </p>
        </div>

        {/* Навигация */}
        <nav className="flex lg:flex-col gap-1 lg:gap-1 lg:flex-1">
          {navItems.map((item) => {
            const active = pathname === item.to;
            if (item.soon) {
              return (
                <div
                  key={item.to}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-foreground/35 cursor-default select-none"
                >
                  <Icon name={item.icon} size={18} />
                  <span className="hidden sm:inline flex-1">{item.label}</span>
                  <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-widest bg-primary-foreground/10 text-primary-foreground/50 px-1.5 py-0.5 rounded-md">скоро</span>
                </div>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-foreground text-primary shadow-sm'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Выход */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-foreground/60 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-all"
        >
          <Icon name="LogOut" size={18} />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </aside>

      <main className="flex-1 p-6 lg:p-12 max-w-6xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-sans text-4xl lg:text-5xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          {actions}
        </header>
        <div className="animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;