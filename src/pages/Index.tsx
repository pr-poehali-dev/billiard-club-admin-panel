import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ClubData {
  name: string;
  description: string;
  address: string;
  phone: string;
  socials: { telegram: string; instagram: string; vk: string };
}

const socialFields: { key: keyof ClubData['socials']; label: string; icon: string; placeholder: string }[] = [
  { key: 'telegram', label: 'Telegram', icon: 'Send', placeholder: '@billiard_club' },
  { key: 'instagram', label: 'Instagram', icon: 'Instagram', placeholder: 'instagram.com/...' },
  { key: 'vk', label: 'ВКонтакте', icon: 'Share2', placeholder: 'vk.com/...' },
];

const Index = () => {
  const [data, setData] = useState<ClubData>({
    name: 'Кий&Лузы',
    description: 'Уютный бильярдный клуб в центре города. 8 профессиональных столов, бар и приятная атмосфера для игры в любое время суток.',
    address: 'г. Москва, ул. Пушкина, д. 12',
    phone: '+7 (495) 123-45-67',
    socials: { telegram: '@kiy_luzy', instagram: 'kiy.luzy', vk: 'vk.com/kiyluzy' },
  });

  const handleSave = () => {
    toast.success('Изменения сохранены', { description: 'Информация о клубе обновлена.' });
  };

  return (
    <AdminLayout
      title="Настройки клуба"
      subtitle="Основная информация, которую увидят ваши гости"
      actions={
        <Button onClick={handleSave} size="lg" className="rounded-xl gap-2">
          <Icon name="Check" size={18} />
          Сохранить
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-7 rounded-3xl border-border/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
              <Icon name="Info" size={20} />
            </div>
            <h2 className="font-semibold text-lg">Об организации</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Название клуба</Label>
            <Input id="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="rounded-xl h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Описание</Label>
            <Textarea id="desc" rows={4} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} className="rounded-xl resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addr">Адрес</Label>
              <div className="relative">
                <Icon name="MapPin" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="addr" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} className="rounded-xl h-11 pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <div className="relative">
                <Icon name="Phone" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="rounded-xl h-11 pl-9" />
              </div>
            </div>
          </div>
        </Card>

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
                value={data.socials[s.key]}
                placeholder={s.placeholder}
                onChange={(e) => setData({ ...data, socials: { ...data.socials, [s.key]: e.target.value } })}
                className="rounded-xl h-11"
              />
            </div>
          ))}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Index;
