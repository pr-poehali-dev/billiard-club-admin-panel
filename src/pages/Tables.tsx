import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Table {
  id: number;
  name: string;
  type: string;
  size: string;
  price: number;
}

const tables: Table[] = [
  { id: 1, name: 'Стол №1', type: 'Русская пирамида', size: '12 фт', price: 700 },
  { id: 2, name: 'Стол №2', type: 'Русская пирамида', size: '12 фт', price: 700 },
  { id: 3, name: 'Стол №3', type: 'Пул', size: '9 фт', price: 600 },
  { id: 4, name: 'Стол №4', type: 'Пул', size: '9 фт', price: 600 },
  { id: 5, name: 'Стол №5', type: 'Снукер', size: '12 фт', price: 850 },
  { id: 6, name: 'VIP Стол', type: 'Русская пирамида', size: '12 фт', price: 1200 },
];

const timeSlots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30', '22:00'];

const today = new Date();
const dates = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return d;
});

const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const Tables = () => {
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const bookedSlots: Record<string, string[]> = {
    '1-0': ['11:30', '16:00'],
    '1-1': ['10:00'],
    '5-0': ['19:00', '20:30'],
  };

  const currentBooked = bookedSlots[`${selectedTable}-${selectedDate}`] || [];
  const table = tables.find((t) => t.id === selectedTable)!;

  const handleBook = () => {
    if (!selectedSlot) return;
    toast.success('Бронирование создано', {
      description: `${table.name}, ${weekdays[dates[selectedDate].getDay()]} ${dates[selectedDate].getDate()}, ${selectedSlot}`,
    });
    setSelectedSlot(null);
  };

  return (
    <AdminLayout
      title="Столы и брони"
      subtitle="Выберите стол, дату и время для бронирования"
      actions={
        <Button variant="outline" size="lg" className="rounded-xl gap-2">
          <Icon name="Download" size={18} />
          Экспорт отчёта
        </Button>
      }
    >
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Список столов */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Icon name="Grid3x3" size={15} /> Бильярдные столы
          </p>
          {tables.map((t) => {
            const active = t.id === selectedTable;
            return (
              <button
                key={t.id}
                onClick={() => { setSelectedTable(t.id); setSelectedSlot(null); }}
                className={`w-full text-left rounded-2xl border p-4 flex items-center gap-4 transition-all hover-lift ${
                  active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 bg-card'
                }`}
              >
                <div className={`w-14 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'felt-texture' : 'bg-muted'}`}>
                  <Icon name="CircleDot" size={18} className={active ? 'text-primary-foreground' : 'text-muted-foreground'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.type} · {t.size}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{t.price}₽</p>
                  <p className="text-[11px] text-muted-foreground">/ час</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Расписание */}
        <Card className="lg:col-span-3 p-7 rounded-3xl border-border/60 shadow-sm h-fit space-y-7">
          <div>
            <h2 className="font-display text-2xl font-semibold mb-1">{table.name}</h2>
            <p className="text-sm text-muted-foreground">{table.type} · {table.size} · {table.price}₽/час</p>
          </div>

          {/* Даты */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Icon name="Calendar" size={15} /> Дата
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((d, i) => {
                const active = i === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(i); setSelectedSlot(null); }}
                    className={`flex flex-col items-center justify-center min-w-[58px] h-[68px] rounded-xl border transition-all ${
                      active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border/60 hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs opacity-70">{weekdays[d.getDay()]}</span>
                    <span className="text-xl font-semibold leading-tight">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Время */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Icon name="Clock" size={15} /> Время
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => {
                const booked = currentBooked.includes(slot);
                const active = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    disabled={booked}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      booked
                        ? 'bg-muted text-muted-foreground/50 border-transparent cursor-not-allowed line-through'
                        : active
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm scale-105'
                        : 'border-border/60 hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div>
              {selectedSlot ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Выбрано:</span>{' '}
                  <span className="font-semibold">{selectedSlot}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Выберите свободный слот</p>
              )}
            </div>
            <Button onClick={handleBook} disabled={!selectedSlot} size="lg" className="rounded-xl gap-2">
              <Icon name="CalendarCheck" size={18} />
              Забронировать
            </Button>
          </div>
        </Card>
      </div>

      {/* Последние брони */}
      <Card className="mt-6 p-7 rounded-3xl border-border/60 shadow-sm">
        <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
          <Icon name="ListChecks" size={20} /> Последние бронирования
        </h2>
        <div className="space-y-2">
          {[
            { table: 'Стол №1', time: 'Сегодня, 11:30', client: 'Алексей М.', status: 'Подтверждено' },
            { table: 'VIP Стол', time: 'Завтра, 19:00', client: 'Ирина К.', status: 'Ожидает' },
            { table: 'Стол №5', time: 'Сегодня, 20:30', client: 'Дмитрий П.', status: 'Подтверждено' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground shrink-0">
                <Icon name="CircleDot" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{b.table} · {b.client}</p>
                <p className="text-xs text-muted-foreground">{b.time}</p>
              </div>
              <Badge variant={b.status === 'Подтверждено' ? 'default' : 'secondary'} className="rounded-full">
                {b.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
};

export default Tables;
