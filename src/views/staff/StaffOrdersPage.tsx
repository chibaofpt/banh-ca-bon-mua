"use client";

import { useMemo, useState } from "react";
import { QrCode, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/src/utils/cn";

// TODO: replace with useEffect → staffOrderService / menuService
// GET /api/menu → MenuItem[]

interface MenuItem {
  id: string;
  name: string;
  category: string;
  /** Price stored as VND integer. Display: price_vnd / 1000 cá. */
  price_vnd: number;
  image_url: string | null;
  is_available: boolean;
}

interface AddonOption {
  option_id: string;
  label: string;
  /** Price delta in VND integer. */
  price_delta_vnd: number;
}

interface AddonGroup {
  group_id: string;
  name: string;
  type: "SELECTOR" | "TOGGLE" | "STEPPER";
  options: AddonOption[];
}

type SweetnessValue = "NONE" | "QUARTER" | "HALF" | "THREE_QUARTER" | "FULL";

interface CartItem {
  cartId: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  sweetness: SweetnessValue;
  note: string;
  addonOptionIds: { option_id: string; quantity: number }[];
  /** Unit price in VND integer (base + addon deltas). */
  unitPrice: number;
}

const SWEETNESS_OPTIONS: { label: string; value: SweetnessValue }[] = [
  { label: "Lạt", value: "NONE" },
  { label: "Vừa", value: "QUARTER" },
  { label: "Ngọt", value: "HALF" },
  { label: "Rất ngọt", value: "THREE_QUARTER" },
  { label: "Ngọt Điên", value: "FULL" },
];

/** StaffOrdersPage — create POS orders with menu grid, addons, cart drawer, and checkout. */
export default function StaffOrdersPage() {
  // ── Server data placeholders ──────────────────────────────────────────────
  // TODO: replace with useEffect → staffOrderService.getMenuItems()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  // TODO: replace with useEffect → fetch addon groups per selected item
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);

  // Suppress unused-variable lint until wired
  void setMenuItems;
  void setAddonGroups;

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>("Tất cả");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // Customization state (for selected item dialog)
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [powderQty, setPowderQty] = useState(0);
  const [sweetness, setSweetness] = useState<SweetnessValue>("QUARTER");
  const [note, setNote] = useState("");

  // Checkout state
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────
  // TODO: derive from items list or fetch separately
  const categories = useMemo(
    () => ["Tất cả", ...new Set(menuItems.map((i) => i.category))],
    [menuItems],
  );

  const visibleItems = useMemo(
    () =>
      menuItems.filter(
        (i) =>
          i.is_available &&
          (activeCategory === "Tất cả" || i.category === activeCategory),
      ),
    [menuItems, activeCategory],
  );

  const total = cart.reduce((s, c) => s + c.unitPrice, 0);

  // ── Item dialog helpers ───────────────────────────────────────────────────
  const openItem = (item: MenuItem) => {
    setSelected(item);
    setSelectedAddonIds([]);
    setPowderQty(0);
    setSweetness("QUARTER");
    setNote("");
    // TODO: fetch addon groups for this item via GET /api/menu → addon_groups per item
  };

  const calcUnitPrice = (): number => {
    if (!selected) return 0;
    const addonTotal = addonGroups
      .flatMap((g) => g.options)
      .filter((o) => selectedAddonIds.includes(o.option_id))
      .reduce((s, o) => s + o.price_delta_vnd, 0);
    // Powder group: find stepper group, each unit = its price delta
    const stepperGroup = addonGroups.find((g) => g.type === "STEPPER");
    const powderAdd = stepperGroup
      ? powderQty * (stepperGroup.options[0]?.price_delta_vnd ?? 0)
      : 0;
    return selected.price_vnd + addonTotal + powderAdd;
  };

  const addToCart = () => {
    if (!selected) return;
    const unitPrice = calcUnitPrice();
    const newItem: CartItem = {
      cartId: `c${Date.now()}`,
      menuItemId: selected.id,
      name: selected.name,
      imageUrl: selected.image_url,
      quantity: 1,
      sweetness,
      note,
      addonOptionIds: selectedAddonIds.map((id) => ({ option_id: id, quantity: 1 })),
      unitPrice,
    };
    setCart((prev) => [...prev, newItem]);
    console.warn("TODO: wire toast — Đã thêm vào giỏ", selected.name);
    setSelected(null);
  };

  const removeCartItem = (cartId: string) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
  };

  const handleCheckClick = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
    setPhone("");
    setNickname("");
    setNeedsNickname(false);
  };

  const handleConfirmOrder = async () => {
    if (!/^\+?84\d{9}$|^0\d{9}$/.test(phone.trim())) {
      console.warn("TODO: wire toast — SĐT không hợp lệ");
      return;
    }
    if (!needsNickname) {
      // First attempt: check if phone exists server-side
      // TODO: wire staffOrderService.lookupUserByPhone(phone)
      // If not found → setNeedsNickname(true) and return
      setNeedsNickname(true);
      console.warn("TODO: wire toast — Khách mới — nhập biệt danh");
      return;
    }
    if (!nickname.trim()) {
      console.warn("TODO: wire toast — Vui lòng nhập biệt danh");
      return;
    }
    setSubmitting(true);
    try {
      // TODO: wire POST /api/staff/orders via staffOrderService.createOrder()
      // Ghost user creation handled server-side — just send phone + optional customer_name
      // Payload shape: { phone, customer_name?: nickname, items: cart, ... }
      console.warn("TODO: wire staffOrderService.createOrder()");
      setCart([]);
      setCheckoutOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Selector/toggle addon logic ───────────────────────────────────────────
  const toggleAddon = (optionId: string, groupType: "SELECTOR" | "TOGGLE") => {
    if (groupType === "SELECTOR") {
      // Find which group this option belongs to, then replace the group selection
      const group = addonGroups.find((g) =>
        g.options.some((o) => o.option_id === optionId),
      );
      if (!group) return;
      const groupOptionIds = group.options.map((o) => o.option_id);
      setSelectedAddonIds((prev) => [
        ...prev.filter((id) => !groupOptionIds.includes(id)),
        optionId,
      ]);
    } else {
      setSelectedAddonIds((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    }
  };

  const sweetnessLabel = (v: SweetnessValue): string =>
    SWEETNESS_OPTIONS.find((s) => s.value === v)?.label ?? v;

  return (
    <>
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
        {visibleItems.length === 0 && menuItems.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Đang tải menu…
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              onClick={() => openItem(item)}
              className="bg-card rounded-2xl border border-border p-3 flex flex-col text-left shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              <div className="aspect-square w-full rounded-xl bg-secondary/40 flex items-center justify-center text-5xl mb-2 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span>🍵</span>
                )}
              </div>
              <h3 className="font-medium text-sm leading-tight line-clamp-1">{item.name}</h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{item.category}</p>
              <div className="text-primary font-semibold text-sm mt-1">
                🐟 {item.price_vnd / 1000} cá
              </div>
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
          <span className="font-medium text-sm">
            {cart.length} món • 🐟 {total / 1000} cá
          </span>
        </button>
      )}

      {/* Item customization dialog */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div>
              <h2 className="font-serif text-xl font-semibold">{selected.name}</h2>
            </div>

            {/* Addon groups */}
            {addonGroups.map((group) => {
              if (group.type === "STEPPER") {
                return (
                  <div key={group.group_id}>
                    <label className="text-sm font-medium text-foreground">{group.name}</label>
                    <div className="flex items-center justify-between mt-1.5 px-3 py-2 rounded-xl border border-border bg-card">
                      <span className="text-sm">Thêm</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setPowderQty(Math.max(0, powderQty - 1))}
                          disabled={powderQty === 0}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-30"
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
                );
              }
              return (
                <div key={group.group_id}>
                  <label className="text-sm font-medium text-foreground">
                    {group.name} {group.type === "SELECTOR" ? "*" : ""}
                  </label>
                  <div className="space-y-1.5 mt-1.5">
                    {group.options.map((opt) => {
                      const checked = selectedAddonIds.includes(opt.option_id);
                      return (
                        <label
                          key={opt.option_id}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-xl border cursor-pointer transition",
                            checked ? "bg-primary/10 border-primary" : "bg-card border-border",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type={group.type === "SELECTOR" ? "radio" : "checkbox"}
                              name={`group-${group.group_id}`}
                              checked={checked}
                              onChange={() =>
                                toggleAddon(opt.option_id, group.type as "SELECTOR" | "TOGGLE")
                              }
                              className="accent-primary"
                            />
                            <span className="text-sm">{opt.label}</span>
                          </div>
                          {opt.price_delta_vnd > 0 && (
                            <span className="text-xs text-muted-foreground">
                              +{opt.price_delta_vnd / 1000} cá
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Sweetness */}
            <div>
              <label className="text-sm font-medium text-foreground">Mức ngọt</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {SWEETNESS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSweetness(s.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs border transition",
                      sweetness === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:bg-secondary/40",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium text-foreground">Ghi chú</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: ít đá, không đường..."
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px] resize-none mt-1.5"
              />
            </div>

            <button
              onClick={addToCart}
              className="w-full bg-primary text-primary-foreground rounded-xl h-11 font-medium text-sm hover:bg-primary/90 transition"
            >
              Thêm vào giỏ • 🐟 {calcUnitPrice() / 1000} cá
            </button>
          </div>
        </div>
      )}

      {/* Cart bottom drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto p-4">
            <h2 className="font-serif text-lg font-semibold mb-4">Giỏ hàng ({cart.length})</h2>

            <div className="space-y-3">
              {cart.map((c) => (
                <div key={c.cartId} className="bg-secondary/30 rounded-xl p-3 flex gap-3">
                  <div className="text-3xl shrink-0">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      "🍵"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h4 className="font-medium text-sm">{c.name}</h4>
                      <span className="text-primary font-semibold text-sm whitespace-nowrap">
                        🐟 {c.unitPrice / 1000} cá
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {sweetnessLabel(c.sweetness)}
                      {c.addonOptionIds.length > 0 && ` • ${c.addonOptionIds.length} addon`}
                    </p>
                    {c.note && (
                      <p className="text-[11px] italic text-muted-foreground mt-0.5">
                        &quot;{c.note}&quot;
                      </p>
                    )}
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
              <span className="font-semibold text-lg text-primary">🐟 {total / 1000} cá</span>
            </div>

            <button
              onClick={handleCheckClick}
              className="w-full bg-primary text-primary-foreground rounded-xl h-11 mt-3 font-medium text-sm hover:bg-primary/90 transition"
            >
              Chốt đơn
            </button>
          </div>
        </div>
      )}

      {/* Checkout dialog */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCheckoutOpen(false)}
          />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl space-y-3">
            <h2 className="font-serif text-lg font-semibold">Thông tin khách hàng</h2>

            <div>
              <label className="text-sm font-medium text-foreground">Số điện thoại khách</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setNeedsNickname(false);
                }}
                placeholder="09xxxxxxxx"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
              />
            </div>

            {needsNickname && (
              <div>
                <label className="text-sm font-medium text-foreground">Biệt danh khách</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ví dụ: Linh Cá Heo"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  SĐT này chưa có hồ sơ — nhập biệt danh để tạo mới
                </p>
              </div>
            )}

            <div className="bg-secondary/30 rounded-xl p-3 text-sm flex justify-between">
              <span>{cart.length} món</span>
              <span className="font-semibold text-primary">🐟 {total / 1000} cá</span>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCheckoutOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary/40 transition"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition disabled:opacity-60"
              >
                {submitting ? "Đang tạo…" : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR scan placeholder dialog */}
      {scanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setScanOpen(false)} />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl space-y-4">
            <h2 className="font-serif text-lg font-semibold">Quét QR khách hàng</h2>
            {/* TODO: wire html5-qrcode scanner → GET /api/staff/scan?token=xxx
                On type="user": pre-fill phone field
                On type="voucher"+DISCOUNT: apply discount to cart
                On type="voucher"+PRODUCT: add free item to cart */}
            <div className="aspect-square bg-secondary/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <QrCode size={64} />
              <p className="text-xs">Đưa mã QR vào khung hình</p>
            </div>
            <button
              onClick={() => setScanOpen(false)}
              className="w-full border border-border rounded-xl py-2 text-sm hover:bg-secondary/40 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}
