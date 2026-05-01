import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { QrCode, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ADDON_GROUPS,
  ADMIN_CATEGORIES,
  AdminMenuItem,
  MOCK_CUSTOMERS,
  SWEETNESS_LEVELS,
  initialAdminMenu,
} from "@/data/admin-data";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  cartId: string;
  item: AdminMenuItem;
  size: string;
  sizeLabel: string;
  toggles: string[]; // option ids
  togglesLabels: string[];
  powderQty: number;
  sweetness: string;
  note: string;
  unitPrice: number;
}

const StaffOrders = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>("Tất cả");
  const [selected, setSelected] = useState<AdminMenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // Customization state
  const [size, setSize] = useState("s");
  const [toggles, setToggles] = useState<string[]>([]);
  const [powderQty, setPowderQty] = useState(0);
  const [sweetness, setSweetness] = useState("Vừa");
  const [note, setNote] = useState("");

  // Checkout state
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);

  const categories = ["Tất cả", ...ADMIN_CATEGORIES];
  const visibleItems = useMemo(
    () =>
      initialAdminMenu.filter(
        (i) => i.available && (activeCategory === "Tất cả" || i.category === activeCategory),
      ),
    [activeCategory],
  );

  const openItem = (item: AdminMenuItem) => {
    setSelected(item);
    setSize("s");
    setToggles([]);
    setPowderQty(0);
    setSweetness("Vừa");
    setNote("");
  };

  const calcUnitPrice = () => {
    if (!selected) return 0;
    const sizeAdd = ADDON_GROUPS[0].options.find((o) => o.id === size)?.price ?? 0;
    const toggleAdd = ADDON_GROUPS[1].options
      .filter((o) => toggles.includes(o.id))
      .reduce((s, o) => s + o.price, 0);
    const powderAdd = powderQty * (ADDON_GROUPS[2].options[0].price);
    return selected.price + sizeAdd + toggleAdd + powderAdd;
  };

  const addToCart = () => {
    if (!selected) return;
    const sizeOpt = ADDON_GROUPS[0].options.find((o) => o.id === size)!;
    const toggleLabels = ADDON_GROUPS[1].options.filter((o) => toggles.includes(o.id)).map((o) => o.label);
    const newItem: CartItem = {
      cartId: `c${Date.now()}`,
      item: selected,
      size,
      sizeLabel: sizeOpt.label,
      toggles,
      togglesLabels: toggleLabels,
      powderQty,
      sweetness,
      note,
      unitPrice: calcUnitPrice(),
    };
    setCart((prev) => [...prev, newItem]);
    toast({ title: "Đã thêm vào giỏ", description: selected.name });
    setSelected(null);
  };

  const removeCartItem = (cartId: string) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  const total = cart.reduce((s, c) => s + c.unitPrice, 0);

  const handleCheckClick = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
    setPhone("");
    setNickname("");
    setNeedsNickname(false);
  };

  const handleConfirmOrder = () => {
    if (!/^09\d{8}$/.test(phone)) {
      toast({ title: "SĐT không hợp lệ", variant: "destructive" });
      return;
    }
    const existing = MOCK_CUSTOMERS.find((c) => c.phone === phone);
    if (!existing && !needsNickname) {
      setNeedsNickname(true);
      toast({ title: "Khách mới", description: "Vui lòng nhập biệt danh để tạo hồ sơ" });
      return;
    }
    if (!existing && !nickname.trim()) {
      toast({ title: "Vui lòng nhập biệt danh", variant: "destructive" });
      return;
    }
    toast({
      title: "Đã chốt đơn 🎉",
      description: `${existing ? existing.nickname : nickname} • ${cart.length} món • 🐟 ${total} cá`,
    });
    setCart([]);
    setCheckoutOpen(false);
  };

  return (
    <AdminShell>
      <div className="px-4 py-4 space-y-4">
        {/* QR scan button */}
        <button
          onClick={() => setScanOpen(true)}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 px-4 flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition"
        >
          <QrCode size={22} />
          <span className="font-medium">Quét QR khách hàng</span>
        </button>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition border",
                activeCategory === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-secondary/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-2 gap-3">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className="bg-card rounded-2xl border border-border p-3 flex flex-col text-left shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="aspect-square w-full rounded-xl bg-secondary/40 flex items-center justify-center text-5xl mb-2">
                {item.image?.startsWith("http") ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span>{item.image}</span>
                )}
              </div>
              <h3 className="font-medium text-sm leading-tight line-clamp-1">{item.name}</h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{item.category}</p>
              <div className="text-primary font-semibold text-sm mt-1">🐟 {item.price} cá</div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating cart button */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-20 right-4 z-40 bg-accent text-accent-foreground rounded-full shadow-xl px-5 py-3 flex items-center gap-2 hover:scale-105 transition"
        >
          <ShoppingBag size={18} />
          <span className="font-medium text-sm">{cart.length} món • 🐟 {total}</span>
        </button>
      )}

      {/* Item customization modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-2xl max-w-md max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif flex items-center gap-2">
                  <span className="text-2xl">{selected.image}</span> {selected.name}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </DialogHeader>

              <div className="space-y-4">
                {/* Size — SELECTOR (radio) */}
                <div>
                  <Label className="text-sm font-medium">{ADDON_GROUPS[0].name} *</Label>
                  <div className="space-y-1.5 mt-1.5">
                    {ADDON_GROUPS[0].options.map((opt) => (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition",
                          size === opt.id ? "bg-primary/10 border-primary" : "bg-card border-border",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="size"
                            checked={size === opt.id}
                            onChange={() => setSize(opt.id)}
                            className="accent-primary"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">+{opt.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Toggles — checkbox */}
                <div>
                  <Label className="text-sm font-medium">{ADDON_GROUPS[1].name}</Label>
                  <div className="space-y-1.5 mt-1.5">
                    {ADDON_GROUPS[1].options.map((opt) => {
                      const checked = toggles.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition",
                            checked ? "bg-primary/10 border-primary" : "bg-card border-border",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setToggles((prev) =>
                                  e.target.checked ? [...prev, opt.id] : prev.filter((x) => x !== opt.id),
                                )
                              }
                              className="accent-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">+{opt.price}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Powder — quantity stepper */}
                <div>
                  <Label className="text-sm font-medium">{ADDON_GROUPS[2].name}</Label>
                  <div className="flex items-center justify-between mt-1.5 px-3 py-2 rounded-xl border border-border bg-card">
                    <span className="text-sm">Bột matcha thêm</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPowderQty(Math.max(0, powderQty - 1))}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
                        disabled={powderQty === 0}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-medium w-6 text-center">{powderQty}g</span>
                      <button
                        onClick={() => setPowderQty(Math.min(5, powderQty + 1))}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sweetness */}
                <div>
                  <Label className="text-sm font-medium">Mức ngọt</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {SWEETNESS_LEVELS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSweetness(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs border transition",
                          sweetness === s
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:bg-secondary/40",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <Label className="text-sm font-medium">Ghi chú</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: ít đá, không đường..."
                    className="rounded-xl mt-1.5 min-h-[60px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={addToCart} className="w-full rounded-xl h-11">
                  Thêm vào giỏ • 🐟 {calcUnitPrice()} cá
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif">Giỏ hàng ({cart.length})</SheetTitle>
          </SheetHeader>

          <div className="space-y-3 mt-4">
            {cart.map((c) => (
              <div key={c.cartId} className="bg-secondary/30 rounded-xl p-3 flex gap-3">
                <div className="text-3xl">{c.item.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <h4 className="font-medium text-sm">{c.item.name}</h4>
                    <span className="text-primary font-semibold text-sm whitespace-nowrap">🐟 {c.unitPrice}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {c.sizeLabel} • {c.sweetness}
                    {c.togglesLabels.length > 0 && ` • ${c.togglesLabels.join(", ")}`}
                    {c.powderQty > 0 && ` • +${c.powderQty}g bột`}
                  </p>
                  {c.note && <p className="text-[11px] italic text-muted-foreground mt-0.5">"{c.note}"</p>}
                </div>
                <button
                  onClick={() => removeCartItem(c.cartId)}
                  className="text-destructive p-1 self-start"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tổng cộng</span>
            <span className="font-semibold text-lg text-primary">🐟 {total} cá</span>
          </div>

          <Button onClick={handleCheckClick} className="w-full rounded-xl h-11 mt-3">
            Chốt đơn
          </Button>
        </SheetContent>
      </Sheet>

      {/* Checkout modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Thông tin khách hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Số điện thoại khách</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setNeedsNickname(false);
                }}
                placeholder="09xxxxxxxx"
                className="rounded-xl mt-1"
              />
              {phone && MOCK_CUSTOMERS.find((c) => c.phone === phone) && (
                <p className="text-[11px] text-primary mt-1">
                  ✓ Khách quen: {MOCK_CUSTOMERS.find((c) => c.phone === phone)?.nickname}
                </p>
              )}
            </div>

            {needsNickname && (
              <div className="animate-fade-in">
                <Label>Biệt danh khách</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ví dụ: Linh Cá Heo"
                  className="rounded-xl mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  SĐT này chưa có hồ sơ — nhập biệt danh để tạo mới
                </p>
              </div>
            )}

            <div className="bg-secondary/30 rounded-xl p-3 text-sm flex justify-between">
              <span>{cart.length} món</span>
              <span className="font-semibold text-primary">🐟 {total} cá</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="rounded-xl">
              Huỷ
            </Button>
            <Button onClick={handleConfirmOrder} className="rounded-xl">
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR scan placeholder */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Quét QR khách hàng</DialogTitle>
          </DialogHeader>
          <div className="aspect-square bg-secondary/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <QrCode size={64} />
            <p className="text-xs">Đưa mã QR vào khung hình</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanOpen(false)} className="rounded-xl w-full">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
};

export default StaffOrders;
