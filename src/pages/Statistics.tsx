import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API = 'https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a';

interface StatEntry {
  id: number;
  table_name: string;
  date: string;
  time_slot: string;
  client_name: string;
  status: string;
  payment_place: string;
  price_per_hour: number;
}

type Period = 'today' | 'yesterday' | 'week' | 'month';

const periods: { key: Period; label: string; icon: string }[] = [
  { key: 'today', label: 'Сегодня', icon: 'Sun' },
  { key: 'yesterday', label: 'Вчера', icon: 'Sunset' },
  { key: 'week', label: 'Неделя', icon: 'CalendarDays' },
  { key: 'month', label: 'Месяц', icon: 'Calendar' },
];

const weekdays = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function getPeriodDates(period: Period): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  if (period === 'today') {
    const s = fmt(now);
    return { from: s, to: s };
  }
  if (period === 'yesterday') {
    const y = new Date(now); y.setDate(now.getDate() - 1);
    const s = fmt(y);
    return { from: s, to: s };
  }
  if (period === 'week') {
    const from = new Date(now); from.setDate(now.getDate() - 6);
    return { from: fmt(from), to: fmt(now) };
  }
  const from = new Date(now); from.setDate(1);
  return { from: fmt(from), to: fmt(now) };
}

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
};

const Statistics = () => {
  const [period, setPeriod] = useState<Period>('today');
  const [entries, setEntries] = useState<StatEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const { from, to } = getPeriodDates(period);
    fetch(`${API}?resource=stats&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const totalOnline = entries.filter((e) => e.payment_place === 'Онлайн').length;
  const totalClub = entries.filter((e) => e.payment_place !== 'Онлайн').length;
  const totalRevenue = entries.reduce((sum, e) => sum + (e.price_per_hour || 0), 0);

  return (
    <AdminLayout
      title="Статистика"
      subtitle="Журнал записей и аналитика бронирований"
    >
      {/* Период */}
      <div className="flex gap-2 flex-wrap mb-6">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              period === p.key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border/60 hover:border-primary/40 hover:bg-accent'
            }`}
          >
            <Icon name={p.icon} size={16} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Итоги */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 rounded-3xl border-border/60 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <Icon name="ListChecks" size={13} /> Всего записей
          </p>
          <p className="text-3xl font-bold">{entries.length}</p>
        </Card>
        <Card className="p-5 rounded-3xl border-border/60 shadow-sm">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <Icon name="Building2" size={13} /> В клубе
          </p>
          <p className="text-3xl font-bold">{totalClub}</p>
        </Card>
        <Card className="p-5 rounded-3xl border-border/60 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <Icon name="Smartphone" size={13} /> Онлайн
          </p>
          <p className="text-3xl font-bold">{totalOnline}</p>
        </Card>
      </div>

      {/* Журнал */}
      <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5 border-b border-border/60">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Icon name="ScrollText" size={20} /> Журнал записей
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Выручка ~</span>
            <span className="font-bold text-foreground">{totalRevenue.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Icon name="Loader2" size={28} className="animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Icon name="CalendarX" size={30} className="opacity-40" />
            <p className="text-sm">Нет записей за этот период</p>
          </div>
        ) : (
          <>
            {/* Шапка таблицы */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_120px_120px] gap-4 px-7 py-3 bg-muted/40 border-b border-border/60 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Стол / Гость</span>
              <span>Дата / Время</span>
              <span>Статус</span>
              <span>Оплата</span>
              <span className="text-right">Сумма</span>
            </div>

            <div className="divide-y divide-border/50">
              {entries.map((e, i) => (
                <div
                  key={e.id}
                  className="grid sm:grid-cols-[1fr_1fr_100px_120px_120px] gap-2 sm:gap-4 px-7 py-4 hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{e.table_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.client_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm">{formatDate(e.date)}</p>
                    <p className="text-xs text-muted-foreground">{e.time_slot}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      variant={e.status === 'Подтверждено' ? 'default' : 'secondary'}
                      className="rounded-full text-xs"
                    >
                      {e.status}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${
                      e.payment_place === 'Онлайн'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-accent text-accent-foreground border border-border/40'
                    }`}>
                      <Icon name={e.payment_place === 'Онлайн' ? 'Smartphone' : 'Building2'} size={12} />
                      {e.payment_place || 'В клубе'}
                    </span>
                  </div>
                  <div className="flex items-center sm:justify-end">
                    <span className="text-sm font-semibold text-primary">
                      {e.price_per_hour ? `${e.price_per_hour.toLocaleString('ru-RU')} ₽` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </AdminLayout>
  );
};

export default Statistics;
