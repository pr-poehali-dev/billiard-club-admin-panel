import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API =
  "https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a";

interface BilliardTable {
  id: number;
  name: string;
  table_type: string;
  size_ft: number;
  price_per_hour: number;
  sort_order: number;
  model: string;
  description: string;
  controller_id: string;
}

const TABLE_TYPES = [
  "Русская пирамида",
  "Пул",
  "Снукер",
  "Американский пул",
  "Карамболь",
];
const SIZES = [6, 7, 8, 9, 10, 11, 12];

const emptyNew = () => ({
  name: "",
  table_type: "Русская пирамида",
  size_ft: 12,
  price_per_hour: 700,
  model: "",
  description: "",
  controller_id: "",
});

const TableSettings = () => {
  const [tables, setTables] = useState<BilliardTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<BilliardTable>>({});
  const [adding, setAdding] = useState(false);
  const [newTable, setNewTable] = useState(emptyNew());
  const [saving, setSaving] = useState<number | string | null>(null);

  const load = () => {
    fetch(`${API}?resource=tables`)
      .then((r) => r.json())
      .then((d) => setTables(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Ошибка загрузки столов"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (t: BilliardTable) => {
    setEditingId(t.id);
    setEditData({
      name: t.name,
      table_type: t.table_type,
      size_ft: t.size_ft,
      price_per_hour: t.price_per_hour,
      model: t.model,
      description: t.description,
      controller_id: t.controller_id,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const upd = <K extends keyof BilliardTable>(k: K, v: BilliardTable[K]) =>
    setEditData((p) => ({ ...p, [k]: v }));

  const saveEdit = async (id: number) => {
    setSaving(id);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_table", id, ...editData }),
      });
      toast.success("Стол обновлён");
      setEditingId(null);
      load();
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(null);
    }
  };

  const deleteTable = async (id: number) => {
    setSaving(id);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_table", id }),
      });
      toast.success("Стол удалён");
      setTables((p) => p.filter((t) => t.id !== id));
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setSaving(null);
    }
  };

  const addTable = async () => {
    if (!newTable.name.trim()) {
      toast.error("Введите название стола");
      return;
    }
    setSaving("new");
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_table", ...newTable }),
      });
      const created = await res.json();
      setTables((p) => [...p, created]);
      setNewTable(emptyNew());
      setAdding(false);
      toast.success("Стол добавлен");
    } catch {
      toast.error("Ошибка добавления");
    } finally {
      setSaving(null);
    }
  };

  const EditForm = ({
    data,
    onChange,
  }: {
    data: Partial<BilliardTable>;
    onChange: <K extends keyof BilliardTable>(
      k: K,
      v: BilliardTable[K],
    ) => void;
  }) => (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Название</Label>
          <Input
            value={data.name || ""}
            onChange={(e) =>
              onChange("name", e.target.value as BilliardTable["name"])
            }
            className="rounded-xl h-10"
            placeholder="Стол №1"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Модель стола</Label>
          <Input
            value={data.model || ""}
            onChange={(e) =>
              onChange("model", e.target.value as BilliardTable["model"])
            }
            className="rounded-xl h-10"
            placeholder="Ливерпуль-Клаб"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Тип игры</Label>
          <Select
            value={data.table_type}
            onValueChange={(v) =>
              onChange("table_type", v as BilliardTable["table_type"])
            }
          >
            <SelectTrigger className="rounded-xl h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Размер (фт)</Label>
          <Select
            value={String(data.size_ft)}
            onValueChange={(v) =>
              onChange("size_ft", Number(v) as BilliardTable["size_ft"])
            }
          >
            <SelectTrigger className="rounded-xl h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} фт
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Цена ₽/час</Label>
          <Input
            type="number"
            value={data.price_per_hour || ""}
            onChange={(e) =>
              onChange(
                "price_per_hour",
                Number(e.target.value) as BilliardTable["price_per_hour"],
              )
            }
            className="rounded-xl h-10"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">ID контроллера</Label>
          <Input
            value={data.controller_id || ""}
            onChange={(e) =>
              onChange(
                "controller_id",
                e.target.value as BilliardTable["controller_id"],
              )
            }
            className="rounded-xl h-10 font-mono"
            placeholder="CTRL-001"
          />
        </div>
        <div className="space-y-1 sm:row-span-2">
          <Label className="text-xs">Описание</Label>
          <Textarea
            value={data.description || ""}
            onChange={(e) =>
              onChange(
                "description",
                e.target.value as BilliardTable["description"],
              )
            }
            className="rounded-xl resize-none"
            rows={3}
            placeholder="Дополнительная информация о столе"
          />
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout
      title="Настройки столов"
      subtitle="Управляйте бильярдными столами клуба"
      actions={
        <Button
          onClick={() => {
            setAdding(true);
            setEditingId(null);
          }}
          size="lg"
          className="rounded-xl gap-2"
        >
          <Icon name="Plus" size={18} /> Добавить стол
        </Button>
      }
    >
      <div className="space-y-3">
        {adding && (
          <Card className="p-6 rounded-3xl border-primary/30 bg-primary/5 shadow-sm animate-scale-in">
            <p className="font-semibold text-sm mb-5 flex items-center gap-2 text-primary">
              <Icon name="Plus" size={16} /> Новый стол
            </p>
            <EditForm
              data={newTable}
              onChange={(k, v) => setNewTable((p) => ({ ...p, [k]: v }))}
            />
            <div className="flex gap-2 mt-5">
              <Button
                onClick={addTable}
                disabled={saving === "new"}
                size="sm"
                className="rounded-xl gap-2"
              >
                <Icon
                  name={saving === "new" ? "Loader2" : "Check"}
                  size={15}
                  className={saving === "new" ? "animate-spin" : ""}
                />
                Сохранить
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  setNewTable(emptyNew());
                }}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                Отмена
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Icon name="Loader2" size={28} className="animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <Card className="p-10 rounded-3xl border-border/60 text-center text-muted-foreground">
            <Icon
              name="CircleDot"
              size={32}
              className="mx-auto mb-3 opacity-30"
            />
            <p>Нет столов. Добавьте первый!</p>
          </Card>
        ) : (
          tables.map((t) => {
            const isEditing = editingId === t.id;
            return (
              <Card
                key={t.id}
                className={`p-5 rounded-3xl border-border/60 shadow-sm transition-all ${isEditing ? "border-primary/30 bg-primary/5" : ""}`}
              >
                {isEditing ? (
                  <div className="space-y-5">
                    <EditForm data={editData} onChange={upd} />
                    <div className="flex gap-2 pt-2 border-t border-border/60">
                      <Button
                        onClick={() => saveEdit(t.id)}
                        disabled={saving === t.id}
                        size="sm"
                        className="rounded-xl gap-2"
                      >
                        <Icon
                          name={saving === t.id ? "Loader2" : "Check"}
                          size={15}
                          className={saving === t.id ? "animate-spin" : ""}
                        />
                        Сохранить
                      </Button>
                      <Button
                        onClick={cancelEdit}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-10 rounded-xl felt-texture flex items-center justify-center shrink-0">
                      <Icon
                        name="CircleDot"
                        size={18}
                        className="text-primary-foreground"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.table_type} · {t.size_ft} фт
                        {t.model && ` · ${t.model}`}
                        {t.controller_id && (
                          <span className="ml-2 font-mono opacity-60">
                            {t.controller_id}
                          </span>
                        )}
                      </p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold text-primary shrink-0">
                      {t.price_per_hour} ₽/час
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        onClick={() => startEdit(t)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl w-9 h-9 p-0"
                      >
                        <Icon name="Pencil" size={15} />
                      </Button>
                      <Button
                        onClick={() => deleteTable(t.id)}
                        disabled={saving === t.id}
                        variant="outline"
                        size="sm"
                        className="rounded-xl w-9 h-9 p-0 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      >
                        <Icon
                          name={saving === t.id ? "Loader2" : "Trash2"}
                          size={15}
                          className={saving === t.id ? "animate-spin" : ""}
                        />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
};

export default TableSettings;
