import AdminLayout from "@/components/AdminLayout";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

const integrations = [
  {
    id: "yclients",
    name: "YCLIENTS",
    description: "Онлайн-запись и управление расписанием",
    icon: "CalendarClock",
    color: "from-orange-500/20 to-orange-600/5",
    border: "border-orange-200/60",
  },
  {
    id: "iiko",
    name: "iiko",
    description: "Автоматизация ресторана и кассы",
    icon: "UtensilsCrossed",
    color: "from-red-500/20 to-red-600/5",
    border: "border-red-200/60",
  },
  {
    id: "rkeeper",
    name: "R-Keeper",
    description: "Кассовая система и управление залом",
    icon: "Monitor",
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-200/60",
  },
  {
    id: "1c",
    name: "1С",
    description: "Бухгалтерия и документооборот",
    icon: "BookOpenCheck",
    color: "from-yellow-500/20 to-yellow-600/5",
    border: "border-yellow-200/60",
  },
  {
    id: "bitrix",
    name: "Битрикс24",
    description: "CRM, задачи и коммуникации",
    icon: "Layers",
    color: "from-sky-500/20 to-sky-600/5",
    border: "border-sky-200/60",
  },
  {
    id: "max",
    name: "Max",
    description: "Мессенджер от VK для бизнеса",
    icon: "MessageSquare",
    color: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-200/60",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Бот для уведомлений и бронирований",
    icon: "Send",
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-200/60",
  },
];

export default function Integrations() {
  return (
    <AdminLayout
      title="Интеграции"
      subtitle="Подключение внешних сервисов и систем"
    >
      <div className="mb-8 rounded-3xl border border-primary/20 bg-primary/5 px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl felt-texture flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="Clock" size={18} className="text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-base">Скоро доступно</p>
          <p className="text-muted-foreground text-sm mt-1">
            Интеграции находятся в разработке. Вы сможете подключить внешние сервисы напрямую из этого раздела без технических знаний.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className={`relative rounded-3xl border ${item.border} bg-gradient-to-br ${item.color} p-6 flex flex-col gap-4 opacity-70`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-background/60 border border-border/40 flex items-center justify-center shadow-sm">
                <Icon name={item.icon as "Send"} size={22} className="text-foreground/70" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground border-border/60">
                скоро
              </Badge>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{item.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
            <button
              disabled
              className="mt-auto w-full rounded-xl border border-border/50 bg-background/40 px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
            >
              Подключить
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
