import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = 'https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a';

interface ClubData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  work_hours: string;
  telegram: string;
  instagram: string;
  vk: string;
  max_messenger: string;
  photos: string[];
}

const emptyData: ClubData = {
  name: '', description: '', address: '', phone: '', email: '', website: '',
  work_hours: '', telegram: '', instagram: '', vk: '', max_messenger: '', photos: [],
};

const socialFields: { key: keyof ClubData; label: string; icon: string; placeholder: string }[] = [
  { key: 'telegram', label: 'Telegram', icon: 'Send', placeholder: '@billiard_club' },
  { key: 'max_messenger', label: 'Max', icon: 'MessageCircle', placeholder: 'max.ru/...' },
  { key: 'instagram', label: 'Instagram', icon: 'Instagram', placeholder: 'instagram.com/...' },
  { key: 'vk', label: 'ВКонтакте', icon: 'Share2', placeholder: 'vk.com/...' },
];

interface Transaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

const PLANS = [
  { id: 'basic', name: 'Базовый', price: 3500, features: ['До 5 столов', 'Онлайн-бронирование', 'Статистика за месяц'] },
  { id: 'extended', name: 'Расширенный', price: 7000, features: ['До 15 столов', 'Онлайн-бронирование', 'Статистика за год', 'Документы и чеки'] },
  { id: 'maximum', name: 'Максимальный', price: 15000, features: ['Без ограничений', 'Онлайн-бронирование', 'Полная аналитика', 'Документы и чеки', 'Приоритетная поддержка'] },
];

const Index = () => {
  const [data, setData] = useState<ClubData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [planDialog, setPlanDialog] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('basic');

  const loadBalance = () => {
    fetch(`${API}?resource=balance`)
      .then((r) => r.json())
      .then((d) => {
        setBalance(d.balance ?? 0);
        setTransactions(d.transactions ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((d) => setData({ ...emptyData, ...d, photos: d.photos || [] }))
      .catch(() => toast.error('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
    loadBalance();
  }, []);

  const upd = (k: keyof ClubData, v: string) => setData((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...data }),
      });
      toast.success('Изменения сохранены', { description: 'Информация о клубе обновлена.' });
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload_photo', file: reader.result, contentType: file.type }),
        });
        const { url } = await res.json();
        setData((p) => ({ ...p, photos: [...p.photos, url] }));
        toast.success('Фото добавлено');
      } catch {
        toast.error('Не удалось загрузить фото');
      } finally {
        setUploading(false);
        if (fileInput.current) fileInput.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (url: string) => setData((p) => ({ ...p, photos: p.photos.filter((x) => x !== url) }));

  if (loading) {
    return (
      <AdminLayout title="Настройки клуба">
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Icon name="Loader2" size={28} className="animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Настройки клуба"
      subtitle="Основная информация, которую увидят ваши гости"
      actions={
        <Button onClick={handleSave} disabled={saving} size="lg" className="rounded-xl gap-2">
          <Icon name={saving ? 'Loader2' : 'Check'} size={18} className={saving ? 'animate-spin' : ''} />
          Сохранить
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-7 rounded-3xl border-border/60 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                <Icon name="Info" size={20} />
              </div>
              <h2 className="font-semibold text-lg">Об организации</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Название клуба</Label>
              <Input id="name" value={data.name} onChange={(e) => upd('name', e.target.value)} className="rounded-xl h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Описание</Label>
              <Textarea id="desc" rows={4} value={data.description} onChange={(e) => upd('description', e.target.value)} className="rounded-xl resize-none" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addr">Адрес</Label>
                <div className="relative">
                  <Icon name="MapPin" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="addr" value={data.address} onChange={(e) => upd('address', e.target.value)} className="rounded-xl h-11 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Режим работы</Label>
                <div className="relative">
                  <Icon name="Clock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="hours" value={data.work_hours} placeholder="Ежедневно 10:00 – 02:00" onChange={(e) => upd('work_hours', e.target.value)} className="rounded-xl h-11 pl-9" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <div className="relative">
                  <Icon name="Phone" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="phone" value={data.phone} onChange={(e) => upd('phone', e.target.value)} className="rounded-xl h-11 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Эл. почта</Label>
                <div className="relative">
                  <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" value={data.email} placeholder="club@mail.ru" onChange={(e) => upd('email', e.target.value)} className="rounded-xl h-11 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site">Сайт</Label>
                <div className="relative">
                  <Icon name="Globe" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="site" value={data.website} placeholder="kiy-luzy.ru" onChange={(e) => upd('website', e.target.value)} className="rounded-xl h-11 pl-9" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-7 rounded-3xl border-border/60 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                  <Icon name="Image" size={20} />
                </div>
                <h2 className="font-semibold text-lg">Фотографии клуба</h2>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-2" disabled={uploading} onClick={() => fileInput.current?.click()}>
                <Icon name={uploading ? 'Loader2' : 'Plus'} size={16} className={uploading ? 'animate-spin' : ''} />
                Добавить
              </Button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>

            {data.photos.length === 0 ? (
              <button onClick={() => fileInput.current?.click()} className="w-full border-2 border-dashed border-border rounded-2xl py-12 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                <Icon name="ImagePlus" size={28} />
                <span className="text-sm">Загрузите фото клуба</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.photos.map((url) => (
                  <div key={url} className="relative group aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                    <img src={url} alt="Фото клуба" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(url)} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="Trash2" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-7 rounded-3xl border-border/60 shadow-sm space-y-6 h-fit">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                <Icon name="AtSign" size={20} />
              </div>
              <h2 className="font-semibold text-lg">Соцсети</h2>
            </div>
            {socialFields.map((s) => (
              <div key={s.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Icon name={s.icon} size={15} />
                  {s.label}
                </Label>
                <Input
                  value={data[s.key] as string}
                  placeholder={s.placeholder}
                  onChange={(e) => upd(s.key, e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            ))}
          </Card>

          <Card className="p-7 rounded-3xl border-border/60 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-1">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
                <Icon name="CreditCard" size={20} />
              </div>
              <h2 className="font-semibold text-lg">Подписка</h2>
            </div>

            <div className="rounded-2xl bg-primary/5 border border-primary/15 px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Тарифный план</p>
                <p className="font-bold text-base">{PLANS.find(p => p.id === currentPlan)?.name ?? 'Базовый'}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-lg">Активен</span>
            </div>

            <div className="rounded-2xl bg-muted/50 border border-border/50 px-5 py-4">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Баланс</p>
              {balance === null ? (
                <div className="flex items-center gap-2 py-1">
                  <Icon name="Loader2" size={18} className="animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Загрузка…</span>
                </div>
              ) : (
                <p className={`text-2xl font-bold tracking-tight ${balance < 0 ? 'text-destructive' : ''}`}>
                  {balance.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽
                </p>
              )}
            </div>

            {transactions.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">Последние операции</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between text-sm px-1">
                      <span className="text-muted-foreground truncate flex-1 pr-2">{tx.description || (tx.type === 'credit' ? 'Пополнение' : 'Списание')}</span>
                      <span className={`font-semibold shrink-0 ${tx.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                        {tx.type === 'credit' ? '+' : '−'}{tx.amount.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => setPlanDialog(true)}>
              <Icon name="ArrowRightLeft" size={16} />
              Сменить тариф
            </Button>
          </Card>
        </div>
      </div>

      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Выберите тарифный план</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            {PLANS.map((plan) => {
              const active = currentPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => { setCurrentPlan(plan.id); setPlanDialog(false); toast.success(`Тариф «${plan.name}» выбран`); }}
                  className={`text-left rounded-2xl border-2 p-5 transition-all ${active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40'}`}
                >
                  <p className="font-bold text-base mb-1">{plan.name}</p>
                  <p className="text-2xl font-bold tracking-tight mb-3">{plan.price.toLocaleString('ru-RU')} <span className="text-base font-normal text-muted-foreground">₽/мес</span></p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={14} className="text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {active && (
                    <span className="mt-4 inline-block text-[10px] font-semibold uppercase tracking-widest bg-primary/10 text-primary px-2.5 py-1 rounded-lg">Текущий</span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Index;