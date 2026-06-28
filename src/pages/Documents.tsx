import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API = "https://functions.poehali.dev/9fdf6b1c-6a62-440a-ac17-588ebd59c90a";

interface Requisites {
  org_full_name: string;
  org_inn: string;
  org_kpp: string;
  org_ogrn: string;
  org_legal_address: string;
  org_bank_name: string;
  org_bik: string;
  org_account: string;
  org_corr_account: string;
  org_director: string;
}

interface OrgDocument {
  id: number;
  doc_type: string;
  doc_number: string;
  doc_date: string;
  amount: number;
  description: string;
  status: string;
  booking_id: number | null;
  created_at: string;
}

const DOC_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  receipt: { label: "Чек оплаты", icon: "Receipt", color: "bg-green-500/10 text-green-600 border-green-200" },
  invoice: { label: "Выставленный счёт", icon: "FileText", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  payout: { label: "Перечисление", icon: "ArrowDownToLine", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  issued: { label: "Выставлен", variant: "secondary" },
  paid: { label: "Оплачен", variant: "default" },
  cancelled: { label: "Отменён", variant: "outline" },
};

const emptyReq = (): Requisites => ({
  org_full_name: "", org_inn: "", org_kpp: "", org_ogrn: "",
  org_legal_address: "", org_bank_name: "", org_bik: "",
  org_account: "", org_corr_account: "", org_director: "",
});

const emptyDoc = () => ({
  doc_type: "receipt",
  doc_number: "",
  doc_date: new Date().toISOString().slice(0, 10),
  amount: "",
  description: "",
  status: "issued",
});

export default function Documents() {
  const [req, setReq] = useState<Requisites>(emptyReq());
  const [reqSaving, setReqSaving] = useState(false);
  const [reqLoading, setReqLoading] = useState(true);

  const [docs, setDocs] = useState<OrgDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDoc, setNewDoc] = useState(emptyDoc());
  const [docSaving, setDocSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}?resource=requisites`)
      .then((r) => r.json())
      .then((d) => setReq({ ...emptyReq(), ...d }))
      .catch(() => {})
      .finally(() => setReqLoading(false));

    loadDocs();
  }, []);

  const loadDocs = () => {
    setDocsLoading(true);
    fetch(`${API}?resource=documents`)
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Ошибка загрузки документов"))
      .finally(() => setDocsLoading(false));
  };

  const saveRequisites = async () => {
    setReqSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_requisites", ...req }),
      });
      toast.success("Реквизиты сохранены");
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setReqSaving(false);
    }
  };

  const addDocument = async () => {
    if (!newDoc.amount || !newDoc.doc_date) {
      toast.error("Заполните сумму и дату");
      return;
    }
    setDocSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_document", ...newDoc }),
      });
      toast.success("Документ добавлен");
      setShowAddDoc(false);
      setNewDoc(emptyDoc());
      loadDocs();
    } catch {
      toast.error("Ошибка добавления");
    } finally {
      setDocSaving(false);
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_document", id }),
      });
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Документ удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const upd = (k: keyof Requisites, v: string) => setReq((p) => ({ ...p, [k]: v }));

  const filteredDocs = filterType === "all"
    ? docs
    : docs.filter((d) => d.doc_type === filterType);

  const totalByType = (type: string) =>
    docs.filter((d) => d.doc_type === type).reduce((s, d) => s + d.amount, 0);

  const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });

  return (
    <AdminLayout
      title="Документы"
      subtitle="Реквизиты организации и платёжные документы"
    >
      <div className="space-y-8">

        {/* ── Реквизиты ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl felt-texture flex items-center justify-center">
                <Icon name="Building2" size={16} className="text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-lg">Реквизиты организации</h2>
            </div>
            <Button
              onClick={saveRequisites}
              disabled={reqSaving || reqLoading}
              size="sm"
              className="rounded-xl gap-2"
            >
              <Icon name={reqSaving ? "Loader2" : "Save"} size={15} className={reqSaving ? "animate-spin" : ""} />
              Сохранить
            </Button>
          </div>

          <Card className="p-6 rounded-3xl border-border/60 shadow-sm">
            {reqLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">
                <Icon name="Loader2" size={24} className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs">Полное наименование организации</Label>
                    <Input value={req.org_full_name} onChange={(e) => upd("org_full_name", e.target.value)} className="rounded-xl h-10" placeholder='ООО "Смарт Бильярд"' />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Руководитель</Label>
                    <Input value={req.org_director} onChange={(e) => upd("org_director", e.target.value)} className="rounded-xl h-10" placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Юридический адрес</Label>
                    <Input value={req.org_legal_address} onChange={(e) => upd("org_legal_address", e.target.value)} className="rounded-xl h-10" placeholder="г. Москва, ул. Примерная, д. 1" />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Регистрационные данные</p>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">ИНН</Label>
                      <Input value={req.org_inn} onChange={(e) => upd("org_inn", e.target.value)} className="rounded-xl h-10 font-mono" placeholder="7700000000" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">КПП</Label>
                      <Input value={req.org_kpp} onChange={(e) => upd("org_kpp", e.target.value)} className="rounded-xl h-10 font-mono" placeholder="770000000" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ОГРН</Label>
                      <Input value={req.org_ogrn} onChange={(e) => upd("org_ogrn", e.target.value)} className="rounded-xl h-10 font-mono" placeholder="1027700000000" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">Банковские реквизиты</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Наименование банка</Label>
                      <Input value={req.org_bank_name} onChange={(e) => upd("org_bank_name", e.target.value)} className="rounded-xl h-10" placeholder='АО "Тинькофф Банк"' />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">БИК</Label>
                      <Input value={req.org_bik} onChange={(e) => upd("org_bik", e.target.value)} className="rounded-xl h-10 font-mono" placeholder="044525974" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Расчётный счёт</Label>
                      <Input value={req.org_account} onChange={(e) => upd("org_account", e.target.value)} className="rounded-xl h-10 font-mono" placeholder="40702810000000000000" />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Корреспондентский счёт</Label>
                      <Input value={req.org_corr_account} onChange={(e) => upd("org_corr_account", e.target.value)} className="rounded-xl h-10 font-mono" placeholder="30101810145250000974" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* ── Документы ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl felt-texture flex items-center justify-center">
                <Icon name="FileStack" size={16} className="text-primary-foreground" />
              </div>
              <h2 className="font-semibold text-lg">Платёжные документы</h2>
            </div>
            <Button
              onClick={() => setShowAddDoc(true)}
              size="sm"
              className="rounded-xl gap-2"
            >
              <Icon name="Plus" size={15} /> Добавить
            </Button>
          </div>

          {/* Сводка */}
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {Object.entries(DOC_TYPES).map(([type, meta]) => (
              <Card key={type} className="p-4 rounded-2xl border-border/60">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={meta.icon as "Receipt"} size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                </div>
                <p className="text-xl font-bold">{fmt(totalByType(type))} ₽</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {docs.filter((d) => d.doc_type === type).length} документов
                </p>
              </Card>
            ))}
          </div>

          {/* Форма добавления */}
          {showAddDoc && (
            <Card className="p-5 rounded-3xl border-primary/30 bg-primary/5 mb-4 animate-scale-in">
              <p className="font-semibold text-sm mb-4 flex items-center gap-2 text-primary">
                <Icon name="Plus" size={15} /> Новый документ
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Тип документа</Label>
                  <Select value={newDoc.doc_type} onValueChange={(v) => setNewDoc((p) => ({ ...p, doc_type: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOC_TYPES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Статус</Label>
                  <Select value={newDoc.status} onValueChange={(v) => setNewDoc((p) => ({ ...p, status: v }))}>
                    <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issued">Выставлен</SelectItem>
                      <SelectItem value="paid">Оплачен</SelectItem>
                      <SelectItem value="cancelled">Отменён</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Номер документа</Label>
                  <Input value={newDoc.doc_number} onChange={(e) => setNewDoc((p) => ({ ...p, doc_number: e.target.value }))} className="rounded-xl h-10 font-mono" placeholder="№ 001" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Дата</Label>
                  <Input type="date" value={newDoc.doc_date} onChange={(e) => setNewDoc((p) => ({ ...p, doc_date: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Сумма, ₽</Label>
                  <Input type="number" value={newDoc.amount} onChange={(e) => setNewDoc((p) => ({ ...p, amount: e.target.value }))} className="rounded-xl h-10" placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Описание</Label>
                  <Input value={newDoc.description} onChange={(e) => setNewDoc((p) => ({ ...p, description: e.target.value }))} className="rounded-xl h-10" placeholder="Комментарий к документу" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={addDocument} disabled={docSaving} size="sm" className="rounded-xl gap-2">
                  <Icon name={docSaving ? "Loader2" : "Check"} size={15} className={docSaving ? "animate-spin" : ""} />
                  Сохранить
                </Button>
                <Button onClick={() => { setShowAddDoc(false); setNewDoc(emptyDoc()); }} variant="outline" size="sm" className="rounded-xl">Отмена</Button>
              </div>
            </Card>
          )}

          {/* Фильтр */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[["all", "Все"], ...Object.entries(DOC_TYPES).map(([k, v]) => [k, v.label])].map(([type, label]) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                  filterType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Список */}
          <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
            {docsLoading ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Icon name="Loader2" size={24} className="animate-spin" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="FileStack" size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Документов нет</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredDocs.map((doc) => {
                  const meta = DOC_TYPES[doc.doc_type] || DOC_TYPES.receipt;
                  const statusMeta = STATUS_LABELS[doc.status] || STATUS_LABELS.issued;
                  return (
                    <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}>
                        <Icon name={meta.icon as "Receipt"} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{meta.label}</span>
                          {doc.doc_number && (
                            <span className="text-xs text-muted-foreground font-mono">{doc.doc_number}</span>
                          )}
                          <Badge variant={statusMeta.variant} className="text-[10px] px-2 py-0">
                            {statusMeta.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{doc.doc_date}</span>
                          {doc.description && (
                            <span className="text-xs text-muted-foreground truncate">{doc.description}</span>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-sm shrink-0">{fmt(doc.amount)} ₽</p>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="shrink-0 w-8 h-8 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all"
                      >
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>
      </div>
    </AdminLayout>
  );
}
