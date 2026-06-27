import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const navItems = [
  { to: '/', label: 'Настройки клуба', icon: 'Settings' },
  { to: '/tables', label: 'Столы и брони', icon: 'Grid3x3' },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const AdminLayout = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-72 felt-texture text-primary-foreground p-6 lg:p-8 flex lg:flex-col gap-6 lg:gap-10 items-center lg:items-stretch justify-between lg:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center">
            <Icon name="CircleDot" size={24} />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="font-display text-2xl tracking-wide font-extrabold">SMARTBILLIARD</p>
            <p className="text-xs text-primary-foreground/60">Панель администратора</p>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 lg:gap-2 lg:mt-2">
          {navItems.map((item) => {
            const active = pathname === item.to;
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

        <div className="mt-auto hidden lg:block">
          <div className="rounded-2xl bg-primary-foreground/10 p-4 text-sm">
            <p className="font-semibold mb-1">Нужна помощь?</p>
            <p className="text-primary-foreground/60 text-xs leading-relaxed">
              Настройте клуб и управляйте бронированиями в пару кликов.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-12 max-w-6xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-foreground">{title}</h1>
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