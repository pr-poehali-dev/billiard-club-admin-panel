import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API = "https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a";

interface TableData {
  id: number;
  name: string;
  table_type: string;
  size_ft: number;
  price_per_hour: number;
  hall_x: number | null;
  hall_y: number | null;
  hall_rotation: number;
}

interface PlacedTable extends TableData {
  x: number;
  y: number;
  rotation: number;
}

const TABLE_COLORS: Record<string, string> = {
  "Русская пирамида": "#1a5c2e",
  "Пул": "#1a3d5c",
  "Снукер": "#5c1a1a",
  "Американский пул": "#3d1a5c",
  "Китайская восьмерка": "#5c4a1a",
};

const TABLE_W = 100;
const TABLE_H = 60;

const getTableSize = (size_ft: number) => {
  const scale = size_ft / 12;
  return { w: Math.round(TABLE_W * scale), h: Math.round(TABLE_H * scale) };
};

export default function HallMap() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [placed, setPlaced] = useState<PlacedTable[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}?resource=hall_map`)
      .then((r) => r.json())
      .then((data: { tables: TableData[]; bg: string | null }) => {
        setTables(data.tables);
        setBgUrl(data.bg);
        const withPos = data.tables
          .filter((t) => t.hall_x !== null && t.hall_y !== null)
          .map((t) => ({
            ...t,
            x: t.hall_x as number,
            y: t.hall_y as number,
            rotation: t.hall_rotation || 0,
          }));
        setPlaced(withPos);
      })
      .catch(() => toast.error("Ошибка загрузки столов"));
  }, []);

  const uploadBg = async (file: File) => {
    setUploadingBg(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const b64 = e.target?.result as string;
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload_hall_bg",
            file: b64,
            contentType: file.type,
          }),
        });
        const json = await res.json();
        setBgUrl(json.url);
        toast.success("Фон загружен");
        setUploadingBg(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Ошибка загрузки фона");
      setUploadingBg(false);
    }
  };

  const removeBg = async () => {
    setBgUrl(null);
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_hall_bg" }),
    }).catch(() => {});
  };

  const unplaced = tables.filter((t) => !placed.some((p) => p.id === t.id));

  const addToCanvas = (t: TableData) => {
    setPlaced((prev) => [
      ...prev,
      { ...t, x: 50, y: 50, rotation: 0 },
    ]);
  };

  const removeFromCanvas = (id: number) => {
    setPlaced((prev) => prev.filter((p) => p.id !== id));
    if (selected === id) setSelected(null);
  };

  const rotate = (id: number) => {
    setPlaced((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
  };

  const onMouseDown = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      setSelected(id);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t = placed.find((p) => p.id === id);
      if (!t) return;
      const { w, h } = getTableSize(t.size_ft);
      const canvasW = rect.width;
      const canvasH = rect.height;
      const px = (t.x / 100) * canvasW;
      const py = (t.y / 100) * canvasH;
      setDragOffset({
        x: e.clientX - rect.left - px - w / 2,
        y: e.clientY - rect.top - py - h / 2,
      });
      setDragging(id);
    },
    [placed]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging === null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const t = placed.find((p) => p.id === dragging);
      if (!t) return;
      const { w, h } = getTableSize(t.size_ft);
      const rawX = e.clientX - rect.left - dragOffset.x - w / 2;
      const rawY = e.clientY - rect.top - dragOffset.y - h / 2;
      const pct = (v: number, max: number, size: number) =>
        Math.max(0, Math.min(100 - (size / max) * 100, (v / max) * 100));
      const x = pct(rawX, rect.width, w);
      const y = pct(rawY, rect.height, h);
      setPlaced((prev) =>
        prev.map((p) => (p.id === dragging ? { ...p, x, y } : p))
      );
    },
    [dragging, dragOffset, placed]
  );

  const onMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_hall_map",
          positions: placed.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            rotation: p.rotation,
          })),
        }),
      });
      toast.success("Схема сохранена");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Схема зала"
      subtitle="Разместите столы на плане бильярдного клуба"
      actions={
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadBg(e.target.files[0])}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingBg}
            size="lg"
            variant="outline"
            className="rounded-xl gap-2"
          >
            <Icon name={uploadingBg ? "Loader2" : "ImagePlus"} size={18} className={uploadingBg ? "animate-spin" : ""} />
            {bgUrl ? "Заменить план" : "Загрузить план"}
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            size="lg"
            className="rounded-xl gap-2"
          >
            <Icon name={saving ? "Loader2" : "Save"} size={18} className={saving ? "animate-spin" : ""} />
            Сохранить схему
          </Button>
        </div>
      }
    >
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Canvas */}
        <div className="flex-1 min-w-0">
          <div
            ref={canvasRef}
            className="relative w-full rounded-3xl overflow-hidden select-none"
            style={{
              aspectRatio: "16/9",
              background: bgUrl
                ? "#1a1a1a"
                : "linear-gradient(135deg, #0f2419 0%, #1a3d2b 50%, #0f2419 100%)",
              border: bgUrl ? "2px solid hsl(var(--border))" : "2px dashed hsl(var(--border) / 0.6)",
              cursor: dragging ? "grabbing" : "default",
            }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {/* Фоновое изображение */}
            {bgUrl && (
              <>
                <img
                  src={bgUrl}
                  alt="План зала"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                  draggable={false}
                />
                <button
                  onClick={removeBg}
                  className="absolute top-3 right-3 z-20 bg-black/60 hover:bg-black/80 text-white rounded-xl px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Icon name="X" size={12} /> Убрать фон
                </button>
              </>
            )}

            {/* Сетка */}
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid" width="5%" height="5%" patternUnits="userSpaceOnUse">
                  <path d="M 0 0 L 0 100% M 0 0 L 100% 0" stroke="white" strokeWidth="0.5" fill="none" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Надпись пустого состояния */}
            {placed.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm pointer-events-none">
                Перетащите столы из списка на схему
              </div>
            )}

            {/* Столы на схеме */}
            {placed.map((t) => {
              const { w, h } = getTableSize(t.size_ft);
              const color = TABLE_COLORS[t.table_type] || "#1a5c2e";
              const isSelected = selected === t.id;
              const isDragged = dragging === t.id;

              return (
                <div
                  key={t.id}
                  style={{
                    position: "absolute",
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    width: w,
                    height: h,
                    cursor: isDragged ? "grabbing" : "grab",
                    transform: `rotate(${t.rotation}deg)`,
                    transformOrigin: "center",
                    zIndex: isDragged ? 100 : isSelected ? 50 : 10,
                    transition: isDragged ? "none" : "box-shadow 0.15s",
                  }}
                  onMouseDown={(e) => onMouseDown(e, t.id)}
                  onClick={() => setSelected(t.id)}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: color,
                      borderRadius: 8,
                      border: isSelected
                        ? "2px solid #ffffff"
                        : "1.5px solid rgba(255,255,255,0.25)",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.5)"
                        : "0 2px 10px rgba(0,0,0,0.4)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontSize: 10,
                        fontWeight: 700,
                        textAlign: "center",
                        lineHeight: 1.2,
                        padding: "0 4px",
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 8,
                      }}
                    >
                      {t.size_ft} фт
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Панель выбранного стола */}
          {selected !== null && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/60">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: TABLE_COLORS[placed.find((p) => p.id === selected)?.table_type || ""] || "#1a5c2e" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{placed.find((p) => p.id === selected)?.name}</p>
                <p className="text-xs text-muted-foreground">{placed.find((p) => p.id === selected)?.table_type}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 text-xs"
                onClick={() => rotate(selected)}
              >
                <Icon name="RotateCw" size={14} /> Повернуть
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                onClick={() => removeFromCanvas(selected)}
              >
                <Icon name="Trash2" size={14} /> Убрать
              </Button>
            </div>
          )}
        </div>

        {/* Список столов */}
        <div className="xl:w-64 shrink-0">
          <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">
            Столы
          </p>
          <div className="space-y-2">
            {tables.map((t) => {
              const isOnCanvas = placed.some((p) => p.id === t.id);
              const color = TABLE_COLORS[t.table_type] || "#1a5c2e";
              return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isOnCanvas
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/60 bg-card cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                  }`}
                  onClick={() => !isOnCanvas && addToCanvas(t)}
                >
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: color }}
                  >
                    <Icon name="CircleDot" size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.size_ft} фт</p>
                  </div>
                  {isOnCanvas ? (
                    <Icon name="Check" size={16} className="text-primary shrink-0" />
                  ) : (
                    <Icon name="Plus" size={16} className="text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Легенда */}
          <div className="mt-6 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Типы</p>
            {Object.entries(TABLE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
                <span className="text-xs text-muted-foreground">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}