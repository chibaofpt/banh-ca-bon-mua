import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ADMIN_CATEGORIES, AdminMenuItem, initialAdminMenu } from "@/data/admin-data";
import { useToast } from "@/hooks/use-toast";

const emptyForm: Omit<AdminMenuItem, "id"> = {
  name: "",
  category: "Daily",
  price: 0,
  description: "",
  image: "🍵",
  available: true,
};

const AdminMenu = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminMenuItem[]>(initialAdminMenu);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (item: AdminMenuItem) => {
    setEditingId(item.id);
    const { id, ...rest } = item;
    setForm(rest);
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Vui lòng nhập tên món", variant: "destructive" });
      return;
    }
    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? { ...form, id: editingId } : i)));
      toast({ title: "Đã cập nhật món" });
    } else {
      setItems((prev) => [...prev, { ...form, id: `m${Date.now()}` }]);
      toast({ title: "Đã thêm món mới" });
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Đã xoá món" });
  };

  const toggleAvailable = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i)));
  };

  return (
    <AdminShell>
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Sản phẩm</h1>
            <p className="text-xs text-muted-foreground">{items.length} món trong menu</p>
          </div>
          <Button onClick={openAdd} className="rounded-xl gap-1.5" size="sm">
            <Plus size={16} /> Thêm món
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-2xl border border-border p-3 flex gap-3 items-center shadow-sm"
            >
              <div className="w-16 h-16 rounded-xl bg-secondary/40 flex items-center justify-center text-3xl shrink-0">
                {item.image?.startsWith("http") ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span>{item.image || "🍵"}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-primary font-semibold text-sm whitespace-nowrap">🐟 {item.price} cá</div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>

                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={item.available} onCheckedChange={() => toggleAvailable(item.id)} />
                    <span className={item.available ? "text-primary" : "text-muted-foreground"}>
                      {item.available ? "Đang bán" : "Tạm hết"}
                    </span>
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg hover:bg-secondary/40 text-muted-foreground"
                      aria-label="Sửa"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                      aria-label="Xoá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Sửa món" : "Thêm món mới"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Tên món</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Matcha Latte"
                className="rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Giá (cá 🐟)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về món"
                className="rounded-xl mt-1 min-h-[70px]"
              />
            </div>
            <div>
              <Label>Ảnh (emoji hoặc URL)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="🍵 hoặc https://..."
                className="rounded-xl mt-1"
              />
            </div>
            <div className="flex items-center justify-between bg-secondary/30 rounded-xl px-3 py-2">
              <Label className="m-0">Trạng thái bán</Label>
              <Switch
                checked={form.available}
                onCheckedChange={(v) => setForm({ ...form, available: v })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Huỷ
            </Button>
            <Button onClick={handleSave} className="rounded-xl">
              {editingId ? "Lưu thay đổi" : "Thêm món"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default AdminMenu;
